import random
import uuid
from datetime import datetime, timezone
from models import Signal

_cycle_count = 0

def generate_materials_signals() -> list[Signal]:
    global _cycle_count
    _cycle_count += 1
    
    signals = []
    timestamp = datetime.now(timezone.utc)
    
    # Lines 1, 3, 4: Normal operation
    for line_id, entity_id in [("LINE-1", "MAT-A"), ("LINE-3", "MAT-C"), ("LINE-4", "MAT-D")]:
        signals.append(Signal(
            signal_id=f"SIG-MAT-{uuid.uuid4().hex[:6]}",
            domain="materials",
            entity_id=entity_id,
            line_id=line_id,
            timestamp=timestamp,
            metric_name="stock_days_remaining",
            value=random.uniform(10.0, 15.0),
            threshold=5.0, # Breaches if below 5.0
            severity_hint="LOW"
        ))
    
    # Line 2: The Demo Incident (Materials + Logistics)
    # Stock drops, supplier delays
    stock_val = max(1.0, 7.0 - (_cycle_count * 1.0))
    delay_val = 0.0 + (_cycle_count * 6.0)
    
    severity = "CRITICAL" if stock_val < 3.0 else ("HIGH" if stock_val < 5.0 else "MEDIUM")
    
    signals.append(Signal(
        signal_id=f"SIG-MAT-{uuid.uuid4().hex[:6]}",
        domain="materials",
        entity_id="MAT-B",
        line_id="LINE-2",
        timestamp=timestamp,
        metric_name="stock_days_remaining",
        value=stock_val,
        threshold=5.0,
        severity_hint=severity,
        text_note="Raw material stock critically low." if severity == "CRITICAL" else None
    ))
    
    signals.append(Signal(
        signal_id=f"SIG-MAT-{uuid.uuid4().hex[:6]}",
        domain="materials",
        entity_id="SUPPLIER-88",
        line_id="LINE-2",
        timestamp=timestamp,
        metric_name="supplier_delay_hours",
        value=delay_val,
        threshold=12.0,
        severity_hint="HIGH" if delay_val > 12.0 else "LOW"
    ))

    return signals
