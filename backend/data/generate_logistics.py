import random
import uuid
from datetime import datetime, timezone
from backend.models import Signal

_cycle_count = 0

def generate_logistics_signals() -> list[Signal]:
    global _cycle_count
    _cycle_count += 1
    
    signals = []
    timestamp = datetime.now(timezone.utc)
    
    # Lines 1, 3, 4: Normal operation
    for line_id, entity_id in [("LINE-1", "LOG-1"), ("LINE-3", "LOG-3"), ("LINE-4", "LOG-4")]:
        signals.append(Signal(
            signal_id=f"SIG-LOG-{uuid.uuid4().hex[:6]}",
            domain="logistics",
            entity_id=entity_id,
            line_id=line_id,
            timestamp=timestamp,
            metric_name="dispatch_delay_hours",
            value=random.uniform(0.0, 2.0),
            threshold=12.0,
            severity_hint="LOW"
        ))
    
    # Line 2: The Demo Incident (Materials + Logistics)
    # Logistics delay hours start increasing due to the materials shortage
    dispatch_delay = 0.0 + (_cycle_count * 2.0)
    severity = "HIGH" if dispatch_delay > 12.0 else "LOW"
    
    signals.append(Signal(
        signal_id=f"SIG-LOG-{uuid.uuid4().hex[:6]}",
        domain="logistics",
        entity_id="LOG-2",
        line_id="LINE-2",
        timestamp=timestamp,
        metric_name="dispatch_delay_hours",
        value=dispatch_delay,
        threshold=12.0,
        severity_hint=severity,
        text_note="Dispatch delayed due to inbound material shortage." if severity == "HIGH" else None
    ))

    return signals
