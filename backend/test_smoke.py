import asyncio
from fastapi.testclient import TestClient
from main import app
from models import Signal
from datetime import datetime
from agents.orchestrator import handle_incident, incident_store, alert_store

def run_smoke_tests():
    print("Starting Smoke Tests for Relix Backend...")
    
    # 1. Initialize TestClient
    client = TestClient(app)
    
    print("\n--- Test 1: API Health (Empty State) ---")
    response = client.get("/api/incidents")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.json() == [], "Expected empty incidents list"
    print("PASS: /api/incidents returned 200 and empty list")
    
    print("\n--- Test 2: Orchestrator Logic ---")
    # Prepare dummy signal
    signals = [
        Signal(
            signal_id="smoke-sig-1",
            domain="machine",
            entity_id="EXT-101",
            line_id="L1",
            timestamp=datetime.utcnow(),
            metric_name="vibration",
            value=9.5,
            threshold=8.0,
            severity_hint="HIGH"
        )
    ]
    
    # Run orchestrator async function
    loop = asyncio.get_event_loop()
    incident = loop.run_until_complete(handle_incident(signals, "L1"))
    
    assert incident is not None, "Incident should be created"
    assert incident.incident_id in incident_store, "Incident should be stored in incident_store"
    assert len(alert_store) == 1, "One alert should be generated"
    print(f"PASS: Orchestrator successfully created Incident {incident.incident_id} and Alert {alert_store[0].alert_id}")
    
    print("\n--- Test 3: API Data Retrieval ---")
    response = client.get("/api/incidents")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["incident_id"] == incident.incident_id
    print("PASS: /api/incidents returns the created incident")
    
    response = client.get(f"/api/incidents/{incident.incident_id}")
    assert response.status_code == 200
    assert response.json()["incident_id"] == incident.incident_id
    print(f"PASS: /api/incidents/{incident.incident_id} returns the correct incident")
    
    print("\n--- Test 4: API Status Update Workflow ---")
    update_data = {"status": "ACKNOWLEDGED"}
    response = client.patch(f"/api/incidents/{incident.incident_id}/status", json=update_data)
    assert response.status_code == 200
    assert response.json()["status"] == "ACKNOWLEDGED"
    print("PASS: Successfully updated incident status to ACKNOWLEDGED")
    
    print("\n--- Test 5: Alerts Retrieval ---")
    # Get alerts for a role that should receive it. 
    # High severity machine issue should go to supervisor and maintenance
    response = client.get("/api/alerts?role=supervisor")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) >= 1
    assert alerts[0]["alert_id"] == alert_store[0].alert_id
    print("PASS: /api/alerts correctly routes alerts to 'supervisor' role")
    
    print("\nAll Smoke Tests Passed Successfully!")

if __name__ == "__main__":
    run_smoke_tests()
