"""
HTTP Endpoint Contract Tests
Tests every REST endpoint for correct method, path, response shape, status codes,
validation, error handling, and field-level contract compliance with the frontend.
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from datetime import datetime

# Set up sys.path so imports work from the backend/ directory
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from main import app
from agents.orchestrator import incident_store, alert_store
from models import (
    DisruptionIncident, DiagnosticResult, DecisionResult, PredictionInfo,
    Evidence, BusinessImpact, WhatIfOption, RecommendedAction, Signal, Alert,
    generate_incident_id, generate_alert_id
)

client = TestClient(app)

# ── Fixtures ──────────────────────────────────────────────────────────────────

def _make_test_incident() -> DisruptionIncident:
    """Create a fully-formed incident and insert into the store."""
    iid = generate_incident_id()
    signal = Signal(
        signal_id="SIG-001",
        domain="machine",
        entity_id="M17",
        line_id="LINE-4",
        timestamp=datetime.utcnow(),
        metric_name="vibration_index",
        value=5.5,
        threshold=5.0,
        severity_hint="HIGH",
        text_note=None,
    )
    diagnostic = DiagnosticResult(
        root_cause="Bearing wear",
        evidence=[Evidence(source_type="incident_report", doc_id="INC-001", snippet="Similar pattern")],
        explanation="Vibration rising",
        prediction=PredictionInfo(
            time_to_failure_hours=8.0,
            confidence="HIGH",
            trend_direction="rising",
            trend_description="Rising 15%/day",
            historical_match=None,
        ),
    )
    decision = DecisionResult(
        business_impact=BusinessImpact(
            units_at_risk=8400,
            orders_at_risk=2,
            delivery_delay_hours=11.0,
            estimated_cost_inr=140000.0,
            severity="CRITICAL",
        ),
        what_if=[
            WhatIfOption(action="DO_NOTHING", units_lost=8400, cost_inr=140000.0, delay_hours=11.0),
            WhatIfOption(action="REPAIR_NOW", units_lost=1176, cost_inr=19600.0, delay_hours=1.5),
        ],
        recommended_action=RecommendedAction(
            action="REPAIR_NOW",
            reason="Minimises downtime",
            sop_reference="SOP-014",
            escalation_required=True,
        ),
        role_summaries={
            "plant_manager": "CRITICAL — repair now",
            "supervisor": "Notify maintenance",
            "maintenance": "Inspect M17",
            "quality": None,
            "materials": None,
            "workforce": None,
        },
    )
    incident = DisruptionIncident(
        incident_id=iid,
        created_at=datetime.utcnow(),
        domain_mix=["machine"],
        line_id="LINE-4",
        risk_score=0.85,
        risk_level="CRITICAL",
        status="OPEN",
        signals=[signal],
        diagnostic=diagnostic,
        decision=decision,
        role_summaries=decision.role_summaries,
    )
    incident_store[iid] = incident
    return incident


def _make_test_alert(incident_id: str) -> Alert:
    alert = Alert(
        alert_id=generate_alert_id(),
        incident_id=incident_id,
        severity="CRITICAL",
        routed_roles=["plant_manager", "supervisor", "maintenance"],
        created_at=datetime.utcnow(),
    )
    alert_store.append(alert)
    return alert


# ── GET /api/incidents ────────────────────────────────────────────────────────

class TestGetIncidents:
    def test_returns_200_and_list(self):
        incident_store.clear()
        _make_test_incident()
        r = client.get("/api/incidents")
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body, list)
        assert len(body) >= 1

    def test_sorted_by_risk_score_descending(self):
        incident_store.clear()
        i1 = _make_test_incident(); i1.risk_score = 0.3
        i2 = _make_test_incident(); i2.risk_score = 0.9
        i3 = _make_test_incident(); i3.risk_score = 0.6
        r = client.get("/api/incidents")
        body = r.json()
        scores = [x["risk_score"] for x in body]
        assert scores == sorted(scores, reverse=True)

    def test_empty_store_returns_empty_list(self):
        incident_store.clear()
        r = client.get("/api/incidents")
        assert r.status_code == 200
        assert r.json() == []

    def test_response_fields_match_contract(self):
        incident_store.clear()
        _make_test_incident()
        r = client.get("/api/incidents")
        inc = r.json()[0]
        required = ["incident_id", "created_at", "domain_mix", "line_id",
                    "risk_score", "risk_level", "status", "signals",
                    "diagnostic", "decision", "role_summaries"]
        for field in required:
            assert field in inc, f"Missing field: {field}"

    def test_signal_text_note_is_nullable(self):
        incident_store.clear()
        _make_test_incident()
        r = client.get("/api/incidents")
        sig = r.json()[0]["signals"][0]
        assert "text_note" in sig
        # text_note can be null (None → null in JSON)

    def test_sop_reference_is_nullable(self):
        incident_store.clear()
        inc = _make_test_incident()
        inc.decision.recommended_action.sop_reference = None
        r = client.get("/api/incidents")
        rec_action = r.json()[0]["decision"]["recommended_action"]
        assert rec_action["sop_reference"] is None


# ── GET /api/incidents/{incident_id} ─────────────────────────────────────────

class TestGetIncident:
    def test_returns_200_for_known_id(self):
        incident_store.clear()
        inc = _make_test_incident()
        r = client.get(f"/api/incidents/{inc.incident_id}")
        assert r.status_code == 200
        assert r.json()["incident_id"] == inc.incident_id

    def test_returns_404_for_unknown_id(self):
        r = client.get("/api/incidents/INC-DOESNOTEXIST")
        assert r.status_code == 404
        body = r.json()
        assert "detail" in body
        # Ensure no Python traceback in the response
        assert "Traceback" not in str(body)

    def test_diagnostic_has_prediction_field(self):
        incident_store.clear()
        inc = _make_test_incident()
        r = client.get(f"/api/incidents/{inc.incident_id}")
        diag = r.json()["diagnostic"]
        assert "prediction" in diag
        assert "confidence" in diag["prediction"]
        assert "trend_direction" in diag["prediction"]


# ── PATCH /api/incidents/{incident_id}/status ─────────────────────────────────

class TestUpdateStatus:
    def test_open_to_acknowledged(self):
        incident_store.clear()
        inc = _make_test_incident()
        r = client.patch(f"/api/incidents/{inc.incident_id}/status",
                         json={"status": "ACKNOWLEDGED"})
        assert r.status_code == 200
        assert r.json()["status"] == "ACKNOWLEDGED"

    def test_persists_in_store(self):
        incident_store.clear()
        inc = _make_test_incident()
        client.patch(f"/api/incidents/{inc.incident_id}/status", json={"status": "ESCALATED"})
        r = client.get(f"/api/incidents/{inc.incident_id}")
        assert r.json()["status"] == "ESCALATED"

    def test_get_list_reflects_status_change(self):
        incident_store.clear()
        inc = _make_test_incident()
        client.patch(f"/api/incidents/{inc.incident_id}/status", json={"status": "RESOLVED"})
        r = client.get("/api/incidents")
        found = next(x for x in r.json() if x["incident_id"] == inc.incident_id)
        assert found["status"] == "RESOLVED"

    def test_returns_404_for_unknown_id(self):
        r = client.patch("/api/incidents/INC-FAKE/status", json={"status": "ACKNOWLEDGED"})
        assert r.status_code == 404

    def test_returns_422_for_invalid_status(self):
        incident_store.clear()
        inc = _make_test_incident()
        r = client.patch(f"/api/incidents/{inc.incident_id}/status",
                         json={"status": "DELETED"})
        assert r.status_code == 422

    def test_returns_422_for_missing_body(self):
        incident_store.clear()
        inc = _make_test_incident()
        r = client.patch(f"/api/incidents/{inc.incident_id}/status", json={})
        assert r.status_code == 422

    def test_all_valid_statuses_accepted(self):
        for status in ["ACKNOWLEDGED", "ESCALATED", "RESOLVED"]:
            incident_store.clear()
            inc = _make_test_incident()
            r = client.patch(f"/api/incidents/{inc.incident_id}/status",
                             json={"status": status})
            assert r.status_code == 200
            assert r.json()["status"] == status


# ── GET /api/alerts ───────────────────────────────────────────────────────────

class TestGetAlerts:
    def test_returns_alerts_for_valid_role(self):
        alert_store.clear()
        incident_store.clear()
        inc = _make_test_incident()
        _make_test_alert(inc.incident_id)
        r = client.get("/api/alerts?role=plant_manager")
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body, list)
        assert len(body) >= 1

    def test_role_filtering_works(self):
        alert_store.clear()
        incident_store.clear()
        inc = _make_test_incident()
        alert = Alert(
            alert_id=generate_alert_id(),
            incident_id=inc.incident_id,
            severity="MEDIUM",
            routed_roles=["supervisor"],  # NOT plant_manager
            created_at=datetime.utcnow(),
        )
        alert_store.append(alert)
        r = client.get("/api/alerts?role=plant_manager")
        assert r.status_code == 200
        assert len(r.json()) == 0

    def test_returns_400_for_invalid_role(self):
        r = client.get("/api/alerts?role=hacker")
        assert r.status_code == 400
        assert "detail" in r.json()

    def test_returns_422_for_missing_role_param(self):
        r = client.get("/api/alerts")
        assert r.status_code == 422

    def test_alert_fields_match_contract(self):
        alert_store.clear()
        incident_store.clear()
        inc = _make_test_incident()
        _make_test_alert(inc.incident_id)
        r = client.get("/api/alerts?role=plant_manager")
        alert = r.json()[0]
        for field in ["alert_id", "incident_id", "severity", "routed_roles", "created_at"]:
            assert field in alert, f"Missing field: {field}"

    def test_alert_incident_id_references_real_incident(self):
        alert_store.clear()
        incident_store.clear()
        inc = _make_test_incident()
        _make_test_alert(inc.incident_id)
        alerts = client.get("/api/alerts?role=supervisor").json()
        for alert in alerts:
            r = client.get(f"/api/incidents/{alert['incident_id']}")
            assert r.status_code == 200


# ── GET /api/domains/{domain}/signals ────────────────────────────────────────

class TestDomainSignals:
    def test_valid_domain_returns_200(self):
        r = client.get("/api/domains/machine/signals")
        assert r.status_code == 200

    def test_returns_signals_list(self):
        r = client.get("/api/domains/machine/signals")
        body = r.json()
        assert "signals" in body
        assert isinstance(body["signals"], list)

    def test_line_id_filter_applied(self):
        r = client.get("/api/domains/machine/signals?line_id=LINE-4")
        assert r.status_code == 200
        body = r.json()
        for sig in body["signals"]:
            assert sig["line_id"] == "LINE-4"

    def test_returns_400_for_invalid_domain(self):
        r = client.get("/api/domains/notadomain/signals")
        assert r.status_code == 400
        assert "detail" in r.json()

    def test_all_valid_domains_accepted(self):
        for domain in ["machine", "quality", "materials", "logistics", "workforce", "demand"]:
            r = client.get(f"/api/domains/{domain}/signals")
            assert r.status_code == 200, f"Failed for domain: {domain}"
