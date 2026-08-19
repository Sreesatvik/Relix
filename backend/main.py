import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import DisruptionIncident, Alert, StatusUpdate
from agents.orchestrator import incident_store, alert_store, ws_manager, handle_incident
from monitor.monitor_agent import run_monitor_loop
from mcp_server.server import get_domain_status

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("relix")

_monitor_task: Optional[asyncio.Task] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage Monitor Agent lifecycle: start on startup, cancel cleanly on shutdown."""
    global _monitor_task
    logger.info("Relix backend starting — initializing Monitor Agent...")
    _monitor_task = asyncio.create_task(run_monitor_loop())
    logger.info("Monitor Agent task created.")
    yield
    # Shutdown
    if _monitor_task and not _monitor_task.done():
        logger.info("Shutting down Monitor Agent...")
        _monitor_task.cancel()
        try:
            await _monitor_task
        except asyncio.CancelledError:
            logger.info("Monitor Agent stopped cleanly.")


app = FastAPI(
    title="Relix Disruption Early Warning System API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Prevent Python tracebacks from leaking to the frontend."""
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )


# ── REST Endpoints ───────────────────────────────────────────

@app.get("/api/incidents", response_model=List[DisruptionIncident])
async def get_incidents():
    """List all incidents, sorted by risk_score descending."""
    incidents = list(incident_store.values())
    incidents.sort(key=lambda x: x.risk_score, reverse=True)
    return incidents


@app.get("/api/incidents/{incident_id}", response_model=DisruptionIncident)
async def get_incident(incident_id: str):
    """Get a single incident by ID. Returns 404 if not found."""
    if incident_id not in incident_store:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return incident_store[incident_id]


@app.patch("/api/incidents/{incident_id}/status", response_model=DisruptionIncident)
async def update_incident_status(incident_id: str, status_update: StatusUpdate):
    """
    Advance incident workflow: OPEN → ACKNOWLEDGED → ESCALATED → RESOLVED.
    Returns 404 if not found. Returns 422 automatically on invalid status (Pydantic).
    """
    if incident_id not in incident_store:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    incident = incident_store[incident_id]
    incident.status = status_update.status
    logger.info(f"Incident {incident_id} status → {status_update.status}")

    try:
        await ws_manager.broadcast(incident.model_dump_json())
    except Exception as e:
        logger.warning(f"WS broadcast failed on status update: {e}")

    return incident


_VALID_ROLES = frozenset({"plant_manager", "supervisor", "maintenance", "quality", "materials", "workforce"})
_VALID_DOMAINS = frozenset({"machine", "quality", "materials", "logistics", "workforce", "demand"})


@app.get("/api/alerts", response_model=List[Alert])
async def get_alerts(role: str = Query(..., description="Role to filter alerts for")):
    """
    Return alerts routed to a specific role, newest first.
    Returns 400 for unrecognised roles.
    """
    if role not in _VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{role}'. Valid roles: {sorted(_VALID_ROLES)}",
        )
    role_alerts = [a for a in alert_store if role in a.routed_roles]
    role_alerts.sort(key=lambda x: x.created_at, reverse=True)
    return role_alerts


@app.get("/api/domains/{domain}/signals")
async def get_domain_signals(domain: str, line_id: Optional[str] = Query(None)):
    """
    Return live signals for a domain, optionally filtered by line_id.
    Delegates to the MCP get_domain_status tool — real data.
    Returns 400 for unrecognised domains.
    """
    if domain not in _VALID_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain '{domain}'. Valid domains: {sorted(_VALID_DOMAINS)}",
        )
    return await get_domain_status(domain=domain, line_id=line_id)


# ── WebSocket Endpoint ───────────────────────────────────────

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """
    Streams Alert objects to connected clients whenever the Orchestrator fires one.
    Safe to disconnect at any time — cleanup is guarded against double-remove.
    """
    await websocket.accept()
    ws_manager.active_connections.append(websocket)
    logger.info(f"WS client connected. Active: {len(ws_manager.active_connections)}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"WS error: {e}")
    finally:
        try:
            ws_manager.active_connections.remove(websocket)
        except ValueError:
            pass
        logger.info(f"WS client disconnected. Active: {len(ws_manager.active_connections)}")
