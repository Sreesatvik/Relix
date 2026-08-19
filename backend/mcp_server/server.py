import asyncio
from typing import Dict, List, Any

# Mock MCP Tools for Phase 2 Testing
# These simulate P2's tools so we can build and test our agents immediately.

async def get_domain_status(domain: str, entity_id: str = None, line_id: str = None) -> Dict[str, Any]:
    """Mock domain status retrieval."""
    await asyncio.sleep(0.1) # Simulate network call
    return {
        "domain": domain,
        "line_id": line_id,
        "entity_id": entity_id,
        "current_status": "mocked_anomaly_detected",
        "active_alerts": 1
    }

async def get_signal_history(entity_id: str, domain: str, hours: int = 72) -> List[Dict[str, Any]]:
    """Mock signal history for trend analysis."""
    await asyncio.sleep(0.1)
    return [
        {"timestamp": f"T-{hours}h", "value": 3.0, "metric": "mock_metric"},
        {"timestamp": "T-24h", "value": 3.5, "metric": "mock_metric"},
        {"timestamp": "T-0h", "value": 4.2, "metric": "mock_metric"}
    ]

async def search_knowledge_base(query: str, doc_type: str = None, top_k: int = 5) -> List[Dict[str, Any]]:
    """Mock RAG search."""
    await asyncio.sleep(0.2)
    
    if doc_type == "incident_report":
        return [{"doc_id": "INC-1042", "content": "Similar pattern preceded a bearing failure 3 months ago on M12."}]
    elif doc_type == "sop":
        return [{"doc_id": "SOP-014", "content": "If bearing wear is detected, shift 30% load to alternate line to prevent failure."}]
    elif doc_type == "escalation_policy":
        return [{"doc_id": "ESC-001", "content": "Escalate to Plant Manager if cost exposure exceeds 1 Lakh INR."}]
    
    return [{"doc_id": "DOC-XYZ", "content": f"Mock result for {query}"}]

async def get_business_context(line_id: str) -> Dict[str, Any]:
    """Mock business context retrieval."""
    await asyncio.sleep(0.1)
    return {
        "line_id": line_id,
        "targets": {"daily_units": 10000, "produced_so_far": 1600},
        "orders_at_risk": 2,
        "cost_per_hour_downtime_inr": 12727,
        "priority": "HIGH"
    }
