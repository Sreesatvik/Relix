import asyncio
from datetime import datetime
from typing import List, Dict

from models import (
    Signal, DisruptionIncident, Alert, 
    generate_incident_id, generate_alert_id
)
from agents import diagnostic_agent, decision_agent
from monitor.risk_rules import compute_risk_score

# In-memory stores
incident_store: Dict[str, DisruptionIncident] = {}
alert_store: List[Alert] = []

# WebSocket connections will be managed here so main.py can append to it
# and orchestrator can broadcast to it.
class WebSocketManager:
    def __init__(self):
        self.active_connections = []

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Failed to send WS message: {e}")

ws_manager = WebSocketManager()

def score_to_level(score: float) -> str:
    if score >= 0.8: return "CRITICAL"
    if score >= 0.6: return "HIGH"
    if score >= 0.4: return "MEDIUM"
    return "LOW"

def compute_routed_roles(severity: str, domains: List[str]) -> List[str]:
    roles = []
    if severity == "CRITICAL":  
        roles = ["plant_manager", "supervisor", "maintenance"]
    elif severity == "HIGH":    
        roles = ["supervisor", "maintenance"]
    elif severity == "MEDIUM":  
        roles = ["supervisor"]
    else:                       
        roles = ["supervisor"]
    
    # Domain-specific additions
    if "quality" in domains:    roles.append("quality")
    if "materials" in domains:  roles.append("materials")
    if "workforce" in domains:  roles.append("workforce")
    
    return list(set(roles))

async def handle_incident(signals: List[Signal], line_id: str) -> DisruptionIncident:
    """
    Called by Monitor Agent when risk threshold is breached.
    Orchestrates the Diagnostic and Decision agents in parallel.
    """
    
    # 1. Run BOTH agents in parallel (The core architectural win of v2)
    diagnostic_result, decision_result = await asyncio.gather(
        diagnostic_agent.run(signals, line_id),
        decision_agent.run(signals, line_id)
    )
    
    # 2. Compute risk score
    risk_score = compute_risk_score(signals)
    risk_level = score_to_level(risk_score)
    domain_mix = list(set(s.domain for s in signals))
    
    # 3. Merge into DisruptionIncident
    incident = DisruptionIncident(
        incident_id=generate_incident_id(),
        created_at=datetime.utcnow(),
        domain_mix=domain_mix,
        line_id=line_id,
        risk_score=risk_score,
        risk_level=risk_level,
        status="OPEN",
        signals=signals,
        diagnostic=diagnostic_result,
        decision=decision_result,
        role_summaries=decision_result.role_summaries,
    )
    
    # 4. Store incident
    incident_store[incident.incident_id] = incident
    
    # 5. Route and Store alert
    alert = Alert(
        alert_id=generate_alert_id(),
        incident_id=incident.incident_id,
        severity=risk_level,
        routed_roles=compute_routed_roles(risk_level, domain_mix),
        created_at=datetime.utcnow(),
    )
    alert_store.append(alert)
    
    # 6. Broadcast Alert via WebSocket
    await ws_manager.broadcast(alert.model_dump_json())
    
    return incident
