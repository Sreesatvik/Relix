import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.data.generate_machine import generate_machine_signals
from backend.data.generate_quality import generate_quality_signals
from backend.data.generate_materials import generate_materials_signals
from backend.data.generate_logistics import generate_logistics_signals
from backend.data.generate_workforce import generate_workforce_signals
from backend.data.generate_demand import generate_demand_signals
from backend.monitor.risk_rules import compute_risk_score
from backend.agents.orchestrator import handle_incident

def test_data_generators():
    print("=== TESTING DATA GENERATORS ===")
    
    generators = [
        ("Machine", generate_machine_signals),
        ("Quality", generate_quality_signals),
        ("Materials", generate_materials_signals),
        ("Logistics", generate_logistics_signals),
        ("Workforce", generate_workforce_signals),
        ("Demand", generate_demand_signals)
    ]
    
    all_signals = []
    
    for name, gen_func in generators:
        print(f"\n--- {name} Signals ---")
        signals = gen_func()
        all_signals.extend(signals)
        for s in signals:
            print(f"[{s.domain}] {s.line_id} -> {s.metric_name}: {s.value:.2f} (Severity: {s.severity_hint})")
            
    return all_signals

def test_monitor_scoring(all_signals):
    print("\n=== TESTING RISK SCORING ===")
    signals_by_line = {}
    for s in all_signals:
        if s.line_id not in signals_by_line:
            signals_by_line[s.line_id] = []
        signals_by_line[s.line_id].append(s)
        
    for line_id, signals in signals_by_line.items():
        risk = compute_risk_score(signals)
        print(f"Line {line_id} Risk Score: {risk:.2f}")
        if risk >= 0.25:
            print(f"   ALERT CROSSED THRESHOLD!")
            handle_incident(signals, line_id)

def run_tests():
    print("Cycle 1 (Normal Operations):")
    signals = test_data_generators()
    test_monitor_scoring(signals)
    
    print("\n" + "="*50 + "\n")
    print("Cycle 7 (Simulating the Demo Incidents maturing over time):")
    for _ in range(6):
        # fast forward 6 cycles
        generate_machine_signals()
        generate_quality_signals()
        generate_materials_signals()
        generate_logistics_signals()
        generate_workforce_signals()
        generate_demand_signals()
        
    signals = test_data_generators() # This will be cycle 8
    test_monitor_scoring(signals)

if __name__ == "__main__":
    run_tests()
