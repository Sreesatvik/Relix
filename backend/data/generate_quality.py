import random
import uuid
from datetime import datetime, timezone
from backend.models import Signal

_cycle_count = 0

def generate_quality_signals() -> list[Signal]:
    global _cycle_count
    _cycle_count += 1
    
    signals = []
    timestamp = datetime.now(timezone.utc)
    
    # Line 1-3: Normal operation
    for line_id, entity_id in [("LINE-1", "BATCH-101"), ("LINE-2", "BATCH-102"), ("LINE-3", "BATCH-103")]:
        signals.append(Signal(
            signal_id=f"SIG-Q-{uuid.uuid4().hex[:6]}",
            domain="quality",
            entity_id=entity_id,
            line_id=line_id,
            timestamp=timestamp,
            metric_name="defect_rate",
            value=random.uniform(0.01, 0.03),
            threshold=0.05,
            severity_hint="LOW"
        ))
    
    # Line 4: The Demo Incident (Machine + Quality)
    # Defect rate rises alongside the machine vibration
    defect_val = 0.04 + (_cycle_count * 0.005)
    severity = "HIGH" if defect_val > 0.05 else "LOW"
    
    signals.append(Signal(
        signal_id=f"SIG-Q-{uuid.uuid4().hex[:6]}",
        domain="quality",
        entity_id="BATCH-104",
        line_id="LINE-4",
        timestamp=timestamp,
        metric_name="defect_rate",
        value=defect_val,
        threshold=0.05,
        severity_hint=severity,
        text_note="Defect rate spiking concurrently with machine vibration alert." if severity == "HIGH" else None
    ))

    return signals
