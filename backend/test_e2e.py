import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from backend.data.generate_machine import generate_machine_signals
from backend.data.generate_quality import generate_quality_signals
from backend.data.generate_materials import generate_materials_signals
from backend.data.generate_logistics import generate_logistics_signals
from backend.data.generate_workforce import generate_workforce_signals
from backend.data.generate_demand import generate_demand_signals
from backend.monitor.risk_rules import compute_risk_score
from backend.agents.orchestrator import handle_incident

def _generate_all_signals():
    generators = [
        generate_machine_signals,
        generate_quality_signals,
        generate_materials_signals,
        generate_logistics_signals,
        generate_workforce_signals,
        generate_demand_signals
    ]
    all_signals = []
    for gen in generators:
        all_signals.extend(gen())
    return all_signals

@pytest.mark.asyncio
async def test_e2e_pipeline():
    """End-to-End test representing one cycle of the system."""
    print("=== TESTING DATA GENERATORS ===")
    signals = _generate_all_signals()
    assert len(signals) > 0
    
    print("\n=== TESTING RISK SCORING ===")
    signals_by_line = {}
    for s in signals:
        if s.line_id not in signals_by_line:
            signals_by_line[s.line_id] = []
        signals_by_line[s.line_id].append(s)
        
    for line_id, line_signals in signals_by_line.items():
        risk = compute_risk_score(line_signals)
        print(f"Line {line_id} Risk Score: {risk:.2f}")
        if risk >= 0.25:
            print(f"   ALERT CROSSED THRESHOLD! Invoking handle_incident...")
            # We await handle_incident to test the orchestrator and agents
            await handle_incident(line_signals, line_id)
            
    print("\n=== SIMULATING TIME PASSING ===")
    for _ in range(6):
        _generate_all_signals()
        
    print("\n=== TESTING LATER CYCLE ===")
    signals = _generate_all_signals()
    for line_id, line_signals in signals_by_line.items():
        risk = compute_risk_score(line_signals)
        if risk >= 0.25:
            await handle_incident(line_signals, line_id)
