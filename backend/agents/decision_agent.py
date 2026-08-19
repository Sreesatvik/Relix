import asyncio
import json
from typing import List
from openai import AsyncOpenAI
import os

from models import Signal, DecisionResult
from mcp_server.server import get_business_context, search_knowledge_base

client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "dummy-key-for-local-testing"),
    base_url=os.getenv("OPENAI_BASE_URL")
)

WHAT_IF_MULTIPLIERS = {
    "DO_NOTHING": 1.0,      # full loss
    "REPAIR_NOW": 0.14,     # 86% saved
    "SHIFT_TO_LINE_3": 0.25 # 75% saved
}

async def run(signals: List[Signal], line_id: str) -> DecisionResult:
    """
    Decision Agent: Computes business impact, what-if projections, and recommends action.
    Runs concurrently with Diagnostic Agent.
    """
    
    # 1. Run tools concurrently
    tool_results = await asyncio.gather(
        get_business_context(line_id=line_id),
        search_knowledge_base(query=f"SOP for {line_id}", doc_type="sop", top_k=3),
        search_knowledge_base(query=f"playbook {line_id}", doc_type="response_playbook", top_k=3),
        search_knowledge_base(query=f"escalation {line_id}", doc_type="escalation_policy", top_k=2)
    )
    
    business_context = tool_results[0]
    sops = tool_results[1]
    playbooks = tool_results[2]
    escalation_policies = tool_results[3]
    
    # 2. Build Prompt
    system_prompt = f"""
    You are a senior plant operations director and decision engine.
    
    Given real-time signals, business context (targets/costs), and SOPs,
    determine:
    1. BUSINESS IMPACT — quantify what is currently at risk
    2. WHAT-IF PROJECTIONS — project losses across these 3 scenarios using the provided multipliers:
       Multiplier Table: {json.dumps(WHAT_IF_MULTIPLIERS)}
       (Multiply the 'DO_NOTHING' base loss by the multiplier to get the scenario's loss)
    3. RECOMMENDED ACTION — what should we do right now?
    4. ROLE SUMMARIES — 1-sentence summaries for different personas (plant_manager, supervisor, maintenance, quality, materials, workforce)
    
    Respond strictly in JSON matching this schema:
    {DecisionResult.model_json_schema()}
    """
    
    user_prompt = f"""
    SIGNALS: {json.dumps([s.model_dump(mode='json') for s in signals])}
    BUSINESS CONTEXT: {json.dumps(business_context)}
    SOPS: {json.dumps(sops)}
    PLAYBOOKS: {json.dumps(playbooks)}
    ESCALATION POLICIES: {json.dumps(escalation_policies)}
    """
    
    # 3. LLM Call
    try:
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
        return DecisionResult.model_validate_json(result_json)
        
    except Exception as e:
        print(f"LLM Call Failed (using fallback mock data): {e}")
        return DecisionResult(
            business_impact={
                "units_at_risk": 8400,
                "orders_at_risk": 2,
                "delivery_delay_hours": 11.0,
                "estimated_cost_inr": 140000.0,
                "severity": "CRITICAL"
            },
            what_if=[
                {"action": "DO_NOTHING", "units_lost": 8400, "cost_inr": 140000.0, "delay_hours": 11.0},
                {"action": "REPAIR_NOW", "units_lost": 1176, "cost_inr": 19600.0, "delay_hours": 1.5},
                {"action": "SHIFT_TO_LINE_3", "units_lost": 2100, "cost_inr": 35000.0, "delay_hours": 3.0}
            ],
            recommended_action={
                "action": "SHIFT_TO_LINE_3",
                "reason": "Reduces unit shortfall by 75% per SOP-014",
                "sop_reference": "SOP-014",
                "escalation_required": True
            },
            role_summaries={
                "plant_manager": "Line 4 at CRITICAL risk — ₹1.4L exposure on 2 orders. Recommend shifting 30% load to Line 3.",
                "supervisor": "Shift 30% of Line 4 output to Line 3, notify maintenance.",
                "maintenance": "Inspect M17 during next window.",
                "quality": "Defect rate may be tied to mechanical fault.",
                "materials": "Check spare parts stock for Line 4.",
                "workforce": None
            }
        )
