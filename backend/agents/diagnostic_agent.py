import asyncio
import json
from typing import List
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

from models import Signal, DiagnosticResult
from mcp_server.server import get_domain_status, get_signal_history, search_knowledge_base

# Initialize OpenAI Client (can be pointed to any OpenAI-compatible endpoint)
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "dummy-key-for-local-testing"),
    base_url=os.getenv("OPENAI_BASE_URL") # E.g., featherless.ai or groq if set
)

async def run(signals: List[Signal], line_id: str) -> DiagnosticResult:
    """
    Diagnostic Agent: Determines root cause, gathers evidence, and predicts time to failure.
    Runs concurrently with Decision Agent.
    """
    
    # 1. Deduplicate domains from signals
    domains = list(set(s.domain for s in signals))
    primary_entity_id = signals[0].entity_id if signals else "UNKNOWN"
    
    # 2. Run tools concurrently
    # Build tasks for domain status (one per domain)
    domain_status_tasks = [get_domain_status(domain=d, entity_id=primary_entity_id, line_id=line_id) for d in domains]
    
    # Run all tool calls
    tool_results = await asyncio.gather(
        *domain_status_tasks,
        get_signal_history(entity_id=primary_entity_id, domain=domains[0]),
        search_knowledge_base(query=f"anomaly on {line_id} entity {primary_entity_id} root cause", doc_type=["incident_report", "root_cause_analysis"], top_k=5)
    )
    
    # Unpack results
    num_domains = len(domains)
    domain_statuses = tool_results[:num_domains]
    signal_history = tool_results[num_domains]
    rag_docs = tool_results[num_domains + 1]
    
    # 3. Build Prompt
    system_prompt = f"""
    You are a senior production diagnostic engineer and predictive analyst.
    
    Given real-time signals, 72-hour trend history, and past incidents from our knowledge base,
    determine:
    1. ROOT CAUSE — what is causing the anomaly
    2. EVIDENCE — cite specific past incidents and data points
    3. EXPLANATION — plain-language summary of what is happening
    4. PREDICTION — based on signal trends and historical patterns:
       - Estimate time to failure (hours) if no action is taken
       - State your confidence (LOW/MEDIUM/HIGH)
       - Describe the trend (e.g., "vibration rising 15%/day")
       - If a similar historical incident exists, cite it

    CRITICAL INSTRUCTION ON HALLUCINATION:
    You must NEVER fabricate or hallucinate evidence or documents. If the retrieved documents (SIMILAR PAST INCIDENTS & ROOT CAUSE DOCS) are empty or none of the retrieved documents are relevant, explicitly state "No relevant evidence found in knowledge base" rather than inventing a document. Do not invent doc_ids.
    
    Respond strictly in JSON matching this schema:
    {DiagnosticResult.model_json_schema()}
    """
    
    user_prompt = f"""
    SIGNALS: {json.dumps([s.model_dump(mode='json') for s in signals])}
    DOMAIN STATUSES: {json.dumps(domain_statuses)}
    TREND HISTORY (72h): {json.dumps(signal_history)}
    SIMILAR PAST INCIDENTS & ROOT CAUSE DOCS: {json.dumps(rag_docs)}
    """
    
    # 4. LLM Call
    try:
        # Note: We use model="gpt-4o-mini" as a default, but any model works if URL is changed
        response = await client.chat.completions.create(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        result_json = response.choices[0].message.content
        return DiagnosticResult.model_validate_json(result_json)
        
    except Exception as e:
        # Fallback for testing when no real LLM API key is provided
        print(f"LLM Call Failed (using fallback mock data): {e}")
        return DiagnosticResult(
            root_cause="Mock Root Cause: Bearing Wear (LLM Fallback)",
            evidence=[{"source_type": "incident_report", "doc_id": "INC-1042", "snippet": "Similar pattern 3 months ago"}],
            explanation="This is a mock diagnostic response because the LLM call failed or wasn't configured.",
            prediction={
                "time_to_failure_hours": 8.5,
                "confidence": "HIGH",
                "trend_direction": "rising",
                "trend_description": "Vibration is trending upwards, breaching threshold soon.",
                "historical_match": "Matches INC-1042"
            }
        )
