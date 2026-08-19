from typing import List
from models import Signal

# MOCK: P1 is supposed to implement this. We implement a dummy version
# just so we can test the orchestrator.

def compute_risk_score(signals: List[Signal]) -> float:
    """Mock risk score computation."""
    if not signals:
        return 0.0
    # Dummy logic: just sum the values or use a fixed score for testing
    return min(1.0, sum(s.value / (s.threshold or 1) for s in signals) * 0.1)
