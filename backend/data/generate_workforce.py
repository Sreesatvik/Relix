import random
import uuid
from datetime import datetime, timezone
from backend.models import Signal

def generate_workforce_signals() -> list[Signal]:
    signals = []
    timestamp = datetime.now(timezone.utc)
    
    for line_id in ["LINE-1", "LINE-2", "LINE-3", "LINE-4"]:
        signals.append(Signal(
            signal_id=f"SIG-WF-{uuid.uuid4().hex[:6]}",
            domain="workforce",
            entity_id=f"SHIFT-{line_id[-1]}",
            line_id=line_id,
            timestamp=timestamp,
            metric_name="staffing_pct_of_plan",
            value=random.uniform(0.95, 1.0),
            threshold=0.85, # Breaches if below 0.85
            severity_hint="LOW"
        ))
    return signals
