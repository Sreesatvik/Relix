import random
import uuid
from datetime import datetime, timezone
from models import Signal

# Global state to simulate progressing anomalies
_cycle_count = 0

def generate_machine_signals() -> list[Signal]:
    global _cycle_count
    _cycle_count += 1
    
    signals = []
    timestamp = datetime.now(timezone.utc)
    
    # Line 1-3: Normal operation
    for line_id, entity_id in [("LINE-1", "M11"), ("LINE-2", "M14"), ("LINE-3", "M15")]:
        signals.append(Signal(
            signal_id=f"SIG-M-{uuid.uuid4().hex[:6]}",
            domain="machine",
            entity_id=entity_id,
            line_id=line_id,
            timestamp=timestamp,
            metric_name="Tool_wear_min",
            value=random.uniform(50.0, 100.0),
            threshold=200.0,
            severity_hint="LOW"
        ))
    
    # Line 4: The Demo Incident (Machine + Quality)
    # Simulating the AI4I Tool Wear / Vibration failure
    base_wear = 180.0
    wear_value = base_wear + (_cycle_count * 5.0) # Gradually increases
    vibration_val = 3.0 + (_cycle_count * 0.5)
    
    severity = "CRITICAL" if wear_value > 210 else ("HIGH" if wear_value > 200 else "MEDIUM")
    
    signals.append(Signal(
        signal_id=f"SIG-M-{uuid.uuid4().hex[:6]}",
        domain="machine",
        entity_id="M17",
        line_id="LINE-4",
        timestamp=timestamp,
        metric_name="Tool_wear_min",
        value=wear_value,
        threshold=200.0,
        severity_hint=severity,
        text_note="High tool wear detected, potential overstrain failure." if wear_value > 200 else None
    ))
    
    signals.append(Signal(
        signal_id=f"SIG-M-{uuid.uuid4().hex[:6]}",
        domain="machine",
        entity_id="M17",
        line_id="LINE-4",
        timestamp=timestamp,
        metric_name="vibration_index",
        value=vibration_val,
        threshold=5.0,
        severity_hint="HIGH" if vibration_val > 5.0 else "LOW",
        text_note="Technician flagged unusual noise on Line 4 conveyor bearing" if vibration_val > 5.0 else None
    ))

    return signals
