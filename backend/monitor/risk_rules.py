from backend.models import Signal

DOMAIN_WEIGHTS = {
    "machine": 0.30,
    "quality": 0.20,
    "materials": 0.20,
    "logistics": 0.15,
    "workforce": 0.10,
    "demand": 0.05
}

SEVERITY_SCORES = {
    "LOW": 0.0,
    "MEDIUM": 0.4,
    "HIGH": 0.7,
    "CRITICAL": 1.0
}

def compute_risk_score(signals: list[Signal]) -> float:
    domain_risks = {d: 0.0 for d in DOMAIN_WEIGHTS.keys()}
    
    for signal in signals:
        score = SEVERITY_SCORES.get(signal.severity_hint, 0.0)
        # We take the max severity within each domain
        if score > domain_risks.get(signal.domain, 0.0):
            domain_risks[signal.domain] = score
            
    total_score = sum(domain_risks[d] * DOMAIN_WEIGHTS[d] for d in DOMAIN_WEIGHTS)
    return total_score
