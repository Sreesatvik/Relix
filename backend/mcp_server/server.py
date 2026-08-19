"""
MCP Server Module

This file exposes the core Model Context Protocol (MCP) server endpoints.
It provides the following 4 tools to the language model:
1. get_domain_status
2. get_signal_history
3. search_knowledge_base
4. get_business_context
"""

from typing import Any, List, Dict, Optional, Union
from mcp_server.rag_store import search
from data.generate_machine import generate_machine_signals
from data.generate_quality import generate_quality_signals
from data.generate_materials import generate_materials_signals
from data.generate_logistics import generate_logistics_signals
from data.generate_workforce import generate_workforce_signals
from data.generate_demand import generate_demand_signals
from data.business_context import BUSINESS_CONTEXT

DOMAIN_GENERATORS = {
    "machine": generate_machine_signals,
    "quality": generate_quality_signals,
    "materials": generate_materials_signals,
    "logistics": generate_logistics_signals,
    "workforce": generate_workforce_signals,
    "demand": generate_demand_signals
}

async def get_domain_status(domain: str, entity_id: str = None, line_id: str = None) -> dict:
    """
    Retrieve the current status and latest signals for a specific operational domain.
    """
    if domain not in DOMAIN_GENERATORS:
        return {"error": f"Domain '{domain}' not found.", "signals": []}
        
    signals = DOMAIN_GENERATORS[domain]()
    
    if entity_id:
        signals = [s for s in signals if s.entity_id == entity_id]
        
    if line_id:
        signals = [s for s in signals if s.line_id == line_id]
        
    return {
        "domain": domain,
        "count": len(signals),
        "signals": [s.model_dump(mode='json') if hasattr(s, "model_dump") else s.dict() for s in signals]
    }

async def get_signal_history(entity_id: str, domain: str, hours: int = 72) -> list[dict]:
    """
    Retrieve the historical progression of a specific metric for a specific entity.
    Note: Since signal data is dynamically generated on the fly and not persisted, 
    this currently returns only the single latest generated signal (the "current" state).
    """
    if domain not in DOMAIN_GENERATORS:
        return []
        
    current_signals = DOMAIN_GENERATORS[domain]()
    filtered = [s for s in current_signals if s.entity_id == entity_id]
    
    return [s.model_dump(mode='json') if hasattr(s, "model_dump") else s.dict() for s in filtered]

async def search_knowledge_base(query: str, doc_type: Union[str, List[str]] = None, top_k: int = 5) -> list[dict]:
    """
    Search the RAG store for standard operating procedures, root cause analyses,
    incident reports, and response playbooks related to the query.
    """
    return search(query=query, doc_type=doc_type, top_k=top_k)

async def get_business_context(line_id: str) -> dict:
    """
    Retrieve high-level business logic, schema, or system-wide context.
    """
    return BUSINESS_CONTEXT.get(line_id, {})
