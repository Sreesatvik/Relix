import asyncio
from models import Signal
from data.generate_machine import generate_machine_signals
from data.generate_quality import generate_quality_signals
from data.generate_materials import generate_materials_signals
from data.generate_logistics import generate_logistics_signals
from data.generate_workforce import generate_workforce_signals
from data.generate_demand import generate_demand_signals
from monitor.risk_rules import compute_risk_score
from agents.orchestrator import handle_incident

RISK_THRESHOLD = 0.25 # Set threshold so that our demo incidents trip it

async def run_monitor_loop(interval_seconds: int = 5):
    print(f"Starting monitor agent loop. Scanning every {interval_seconds}s...")
    
    # We will track which lines have already fired to avoid spamming the orchestrator in the mock
    _alerted_lines = set()

    while True:
        try:
            # 1. Fetch all signals
            all_signals = []
            all_signals.extend(generate_machine_signals())
            all_signals.extend(generate_quality_signals())
            all_signals.extend(generate_materials_signals())
            all_signals.extend(generate_logistics_signals())
            all_signals.extend(generate_workforce_signals())
            all_signals.extend(generate_demand_signals())
            
            # 2. Group by line_id
            signals_by_line = {}
            for s in all_signals:
                if s.line_id not in signals_by_line:
                    signals_by_line[s.line_id] = []
                signals_by_line[s.line_id].append(s)
                
            # 3. Compute risk and fire alerts
            for line_id, signals in signals_by_line.items():
                risk = compute_risk_score(signals)
                if risk >= RISK_THRESHOLD:
                    if line_id not in _alerted_lines:
                        print(f"\\n[Monitor] ALERT: {line_id} crossed threshold with risk {risk:.2f}")
                        await handle_incident(signals, line_id)
                        _alerted_lines.add(line_id)
                else:
                    # Reset if it goes below threshold
                    if line_id in _alerted_lines:
                        _alerted_lines.remove(line_id)
            
        except Exception as e:
            print(f"[Monitor] Error in loop: {e}")
            
        await asyncio.sleep(interval_seconds)
