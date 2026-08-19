from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Signal(BaseModel):
    signal_id: str
    domain: str  # machine | quality | materials | logistics | workforce | demand
    entity_id: str
    line_id: str
    timestamp: datetime
    metric_name: str
    value: float
    threshold: float
    severity_hint: str  # LOW | MEDIUM | HIGH | CRITICAL
    text_note: Optional[str] = None
