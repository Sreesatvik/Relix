import asyncio
from typing import Callable, List
from datetime import datetime
from models import Signal

# MOCK: P1 is supposed to implement this loop.
# We implement a dummy version that fires a synthetic incident 
# shortly after startup so we can test the orchestrator end-to-end.

async def start(handle_incident_callback: Callable):
    """
    Mock Monitor Agent background loop.
    Fires an incident after 3 seconds for testing purposes.
    """
    print("Monitor Agent started. Waiting 3 seconds before firing mock incident...")
    await asyncio.sleep(3)
    
    mock_signals = [
        Signal(
            signal_id="SIG-TEST-1",
            domain="machine",
            entity_id="M17",
            line_id="LINE-4",
            timestamp=datetime.utcnow(),
            metric_name="vibration_index",
            value=4.8,
            threshold=5.0,
            severity_hint="HIGH",
            text_note="Approaching threshold rapidly."
        ),
        Signal(
            signal_id="SIG-TEST-2",
            domain="quality",
            entity_id="BATCH-099",
            line_id="LINE-4",
            timestamp=datetime.utcnow(),
            metric_name="defect_rate",
            value=3.2,
            threshold=3.0,
            severity_hint="MEDIUM",
            text_note="Minor defect spike observed."
        )
    ]
    
    print(f"Monitor Agent: Risk detected on LINE-4! Calling orchestrator...")
    await handle_incident_callback(mock_signals, "LINE-4")
    
    # After the first one, we just sleep forever so the server doesn't keep firing them
    while True:
        await asyncio.sleep(60)
