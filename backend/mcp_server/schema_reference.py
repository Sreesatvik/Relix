"""
Schema Reference Documentation (Non-Executable)

This file contains the reference JSON schemas and domain contracts agreed upon
for the Relix system. It serves as documentation for developers and subagents
working on the MCP Server, Monitoring Loop, RAG pipeline, and Orchestrator.

===============================================================================
1. SIGNAL JSON SCHEMA
===============================================================================
{
  "signal_id": "SIG-00231",
  "domain": "machine",
  "entity_id": "M17",
  "line_id": "LINE-4",
  "timestamp": "2026-08-19T10:31:00Z",
  "metric_name": "Tool_wear_min",
  "value": 210,
  "threshold": 200,
  "severity_hint": "HIGH",
  "text_note": "optional string"
}

Confirmed metric_name values by domain:
  - machine: Tool_wear_min, vibration_index
  - quality: defect_rate
  - materials: stock_days_remaining, supplier_delay_hours
  - logistics: dispatch_delay_hours
  - workforce: staffing_pct_of_plan
  - demand: demand_vs_capacity_ratio

===============================================================================
2. DISRUPTION INCIDENT JSON SCHEMA
===============================================================================
{
  "incident_id": "INC-2026-0819-01",
  "line_id": "LINE-4",
  "timestamp": "2026-08-19T10:31:00Z",
  "risk_score": 0.85,
  "severity": "CRITICAL",
  "status": "OPEN",
  "triggering_signals": [
    {
      "signal_id": "SIG-M-a1b2c3",
      "domain": "machine",
      "entity_id": "M17",
      "line_id": "LINE-4",
      "timestamp": "2026-08-19T10:31:00Z",
      "metric_name": "Tool_wear_min",
      "value": 215.0,
      "threshold": 200.0,
      "severity_hint": "HIGH",
      "text_note": "High tool wear detected, potential overstrain failure."
    },
    {
      "signal_id": "SIG-Q-d4e5f6",
      "domain": "quality",
      "entity_id": "BATCH-104",
      "line_id": "LINE-4",
      "timestamp": "2026-08-19T10:31:00Z",
      "metric_name": "defect_rate",
      "value": 0.055,
      "threshold": 0.05,
      "severity_hint": "HIGH",
      "text_note": "Defect rate spiking concurrently with machine vibration alert."
    }
  ],
  "affected_entities": ["M17", "BATCH-104"],
  "summary": "Critical machine tool wear and quality defect rate breach on LINE-4"
}

===============================================================================
3. CONFIRMED DEMO ENTITIES
===============================================================================
Incident 1 (Machine + Quality):
  - Line ID: LINE-4
  - Machine Entity: M17
  - Quality Batch Entity: BATCH-104

Incident 2 (Materials + Logistics):
  - Line ID: LINE-2
  - Material Entity: MAT-B
  - Supplier Entity: SUPPLIER-88
  - Logistics Entity: LOG-2
"""
