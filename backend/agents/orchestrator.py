from backend.models import Signal

def handle_incident(signals: list[Signal], line_id: str) -> None:
    # MOCK implementation for Backend Developer 1
    # Backend Developer 3 will replace this with the real agent orchestrator.
    high_sev = [s.metric_name for s in signals if s.severity_hint in ["HIGH", "CRITICAL"]]
    print(f"[Orchestrator Mock] Handling incident for {line_id}. Critical signals: {high_sev}")
