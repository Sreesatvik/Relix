import random
import uuid
from datetime import datetime, timezone
from backend.models import Signal

def generate_demand_signals() -> list[Signal]:
    signals = []
    timestamp = datetime.now(timezone.utc)
    
    for line_id in ["LINE-1", "LINE-2", "LINE-3", "LINE-4"]:
        signals.append(Signal(
            signal_id=f"SIG-DEM-{uuid.uuid4().hex[:6]}",
            domain="demand",
            entity_id=f"ORD-{line_id[-1]}00",
            line_id=line_id,
            timestamp=timestamp,
            metric_name="demand_vs_capacity_ratio",
            value=random.uniform(0.8, 0.95),
            threshold=1.1,
            severity_hint="LOW"
        ))
    return signals
