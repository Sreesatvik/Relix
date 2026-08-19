from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict
from datetime import datetime
import uuid

# --- §3.1 Universal Signal Schema ---
class Signal(BaseModel):
    signal_id: str
    domain: Literal["machine", "quality", "materials", "logistics", "workforce", "demand"]
    entity_id: str
    line_id: str
    timestamp: datetime
    metric_name: str
    value: float
    threshold: float
    severity_hint: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    text_note: Optional[str] = None

# --- §3.3 Diagnostic block ---
class Evidence(BaseModel):
    source_type: str          # incident_report, maintenance_log, etc.
    doc_id: str
    snippet: str

class PredictionInfo(BaseModel):
    time_to_failure_hours: Optional[float] = None
    confidence: Literal["LOW", "MEDIUM", "HIGH"]
    trend_direction: Literal["rising", "stable", "falling"]
    trend_description: str    # "Vibration rising 15%/day, projected breach in ~8h"
    historical_match: Optional[str] = None  # "Similar to INC-1042 which led to bearing failure"

class DiagnosticResult(BaseModel):
    root_cause: str
    evidence: List[Evidence]
    explanation: str
    prediction: PredictionInfo

# --- §3.3 Decision block ---
class BusinessImpact(BaseModel):
    units_at_risk: int
    orders_at_risk: int
    delivery_delay_hours: float
    estimated_cost_inr: float
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]

class WhatIfOption(BaseModel):
    action: str
    units_lost: int
    cost_inr: float
    delay_hours: float

class RecommendedAction(BaseModel):
    action: str
    reason: str
    sop_reference: Optional[str] = None
    escalation_required: bool = False

class DecisionResult(BaseModel):
    business_impact: BusinessImpact
    what_if: List[WhatIfOption]
    recommended_action: RecommendedAction
    role_summaries: Dict[str, Optional[str]]

# --- §3.3 The ONE merged object ---
class DisruptionIncident(BaseModel):
    incident_id: str
    created_at: datetime
    domain_mix: List[str]
    line_id: str
    risk_score: float
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    status: Literal["OPEN", "ACKNOWLEDGED", "ESCALATED", "RESOLVED"] = "OPEN"
    signals: List[Signal]
    diagnostic: Optional[DiagnosticResult] = None
    decision: Optional[DecisionResult] = None
    role_summaries: Optional[Dict[str, Optional[str]]] = None

# --- §3.4 Alert ---
class Alert(BaseModel):
    alert_id: str
    incident_id: str
    severity: str
    routed_roles: List[str]
    created_at: datetime
    read: bool = False

# --- API request models ---
class StatusUpdate(BaseModel):
    status: Literal["ACKNOWLEDGED", "ESCALATED", "RESOLVED"]

def generate_incident_id() -> str:
    """Helper to generate a unique incident ID."""
    return f"INC-{str(uuid.uuid4())[:8].upper()}"

def generate_alert_id() -> str:
    """Helper to generate a unique alert ID."""
    return f"ALERT-{str(uuid.uuid4())[:8].upper()}"
