import asyncio
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import DisruptionIncident, Alert, StatusUpdate
from agents.orchestrator import incident_store, alert_store, ws_manager, handle_incident
from monitor import monitor_agent

app = FastAPI(title="Relix Disruption Early Warning System API")

# Allow all CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Start the 24/7 Monitor Agent loop."""
    print("Starting FastAPI and initializing Monitor Agent...")
    asyncio.create_task(monitor_agent.start(handle_incident))

@app.get("/api/incidents", response_model=List[DisruptionIncident])
async def get_incidents():
    """List all incidents, sorted by risk_score desc."""
    incidents = list(incident_store.values())
    incidents.sort(key=lambda x: x.risk_score, reverse=True)
    return incidents

@app.get("/api/incidents/{incident_id}", response_model=DisruptionIncident)
async def get_incident(incident_id: str):
    """Get single incident detail."""
    if incident_id not in incident_store:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident_store[incident_id]

@app.patch("/api/incidents/{incident_id}/status", response_model=DisruptionIncident)
async def update_incident_status(incident_id: str, status_update: StatusUpdate):
    """Workflow state machine: OPEN -> ACKNOWLEDGED -> ESCALATED -> RESOLVED."""
    if incident_id not in incident_store:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident = incident_store[incident_id]
    incident.status = status_update.status
    
    # Broadcast status change to clients via WebSocket
    await ws_manager.broadcast(incident.model_dump_json())
    
    return incident

@app.get("/api/alerts", response_model=List[Alert])
async def get_alerts(role: str):
    """Get alerts routed to a specific role, unread first."""
    # Filter alerts containing the requested role
    role_alerts = [a for a in alert_store if role in a.routed_roles]
    # Sort unread first, then by creation date descending
    role_alerts.sort(key=lambda x: (not x.read, x.created_at), reverse=True)
    return role_alerts

@app.get("/api/domains/{domain}/signals")
async def get_domain_signals(domain: str, line_id: str = None):
    """Raw signals for drill-down. Mocked here since P1 owns the data files."""
    # In a real app, this would read from P1's synthetic data JSON files.
    return {"domain": domain, "line_id": line_id, "signals": []}

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """Live push of alerts as they are created by the Orchestrator."""
    await websocket.accept()
    ws_manager.active_connections.append(websocket)
    try:
        while True:
            # Keep connection alive, wait for client messages (optional)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.active_connections.remove(websocket)
