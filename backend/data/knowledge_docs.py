"""
Knowledge Documents Registry for Relix RAG Pipeline

This module defines the schema and registry for knowledge documents used by the RAG search system.

Schema for each item in KNOWLEDGE_DOCS:
{
    "doc_id": str,            # Unique identifier for the document (e.g., "DOC-INC-001", "SOP-M-01")
    "doc_type": str,          # Category. Allowed values:
                              #   - incident_report
                              #   - root_cause_analysis
                              #   - sop
                              #   - escalation_policy
                              #   - response_playbook
                              #   - safety_policy
    "line_id": str | None,    # Specific line ID if applicable (e.g., "LINE-4"), else None
    "entity_id": str | None,  # Specific entity ID if applicable (e.g., "M17", "MAT-B"), else None
    "text": str               # Full text content of the document
}
"""

from typing import List, Dict, Any

KNOWLEDGE_DOCS: List[Dict[str, Any]] = [
    {
        "doc_id": "INC-1042",
        "doc_type": "incident_report",
        "line_id": "LINE-4",
        "entity_id": "M17",
        "text": "On October 12th, 2025, an unexpected bearing failure occurred on the primary drive assembly of M17 located on LINE-4. Prior to the failure, telemetry indicated a concurrent spike in both Tool_wear_min above 205 minutes and an elevated vibration_index exceeding 4.5. The root cause was determined to be prolonged mechanical overstrain which compromised the structural integrity of the bearing housing. Maintenance personnel resolved the issue by completely replacing the drive bearing assembly and recalibrating the line tensioners."
    },
    {
        "doc_id": "RCA-1042",
        "doc_type": "root_cause_analysis",
        "line_id": None,
        "entity_id": "M17",
        "text": "This analysis investigates the compounding mechanical degradation observed on M17 when elevated tool wear is accompanied by high vibration levels. Extended operation with high tool wear introduces significant asymmetric loading on the primary rotary shaft. This imbalance manifests as high-frequency vibrations that rapidly deteriorate the protective lubrication film within the bearing races. Consequently, the localized friction generates intense heat and accelerates metal fatigue, ultimately culminating in premature bearing seizure."
    },
    {
        "doc_id": "SOP-014",
        "doc_type": "sop",
        "line_id": None,
        "entity_id": None,
        "text": "When telemetry alerts indicate that both tool wear and vibration thresholds have been breached concurrently, operators must immediately initiate a controlled shutdown of the affected line to isolate the equipment. Once the machine is secured and locked out, maintenance technicians are required to visually and physically inspect the primary bearing assemblies for signs of thermal damage or metal particulate. If significant degradation is observed, the team must proactively schedule a complete bearing replacement before restarting normal operations. Production supervisors must evaluate reducing operational speeds if temporary operation is strictly required prior to full repair."
    },
    {
        "doc_id": "PLAY-014",
        "doc_type": "response_playbook",
        "line_id": "LINE-4",
        "entity_id": "M17",
        "text": "In the event that M17 experiences a critical failure requiring extended downtime, production supervisors must immediately execute a workload transfer from LINE-4 to an available alternate line. The process begins by safely halting material inflow to LINE-4 and rerouting all pending high-priority work orders to LINE-2. Logistics teams must simultaneously redirect raw material deliveries to the staging area of the newly activated line to ensure continuous production throughput. Quality assurance personnel must be notified to increase sampling rates during the first four hours of the transition to verify product consistency."
    },
    {
        "doc_id": "INC-2091",
        "doc_type": "incident_report",
        "line_id": "LINE-2",
        "entity_id": "MAT-B",
        "text": "On May 4th, 2025, a critical logistical failure at SUPPLIER-88 resulted in a 72-hour delay in the delivery of raw material MAT-B. This extended delay caused the stock_days_remaining metric at our primary warehouse to plummet below the minimum safety threshold of 3 days. Consequently, production on LINE-2 was severely throttled to conserve remaining inventory, which subsequently cascaded into downstream dispatch delays of up to 24 hours on LOG-2. The crisis was eventually mitigated by expediting an emergency freight shipment from a secondary vendor at a significant premium."
    },
    {
        "doc_id": "RCA-2091",
        "doc_type": "root_cause_analysis",
        "line_id": "LINE-2",
        "entity_id": "MAT-B",
        "text": "This root cause analysis examines the inventory management failure triggered by a 48-hour delivery delay of MAT-B from SUPPLIER-88. The primary underlying cause was an overly aggressive reduction in buffer stock, implemented last quarter to minimize holding costs, which left the facility with zero margin for supply chain volatility. When the shipment was delayed at the port of origin, the reduced inventory levels rapidly deteriorated to stock-out conditions within 48 hours. This lack of raw material halted manufacturing operations on LINE-2, proving that the current just-in-time inventory model is insufficiently resilient for critical single-source materials."
    },
    {
        "doc_id": "PLAY-2091",
        "doc_type": "response_playbook",
        "line_id": "LINE-2",
        "entity_id": "MAT-B",
        "text": "When telemetry indicates that MAT-B stock levels have crashed below the critical 3-day threshold, procurement teams must immediately enact emergency sourcing protocols. The primary action is to activate pre-negotiated contracts with secondary vendors to secure an expedited delivery via air freight within 24 hours. Concurrently, supply chain managers must dynamically re-route any available on-site MAT-B inventory exclusively to LINE-2 to sustain critical production runs. Customer success representatives are required to proactively communicate updated delivery schedules and expected dispatch delays to all affected clients utilizing LOG-2 logistics."
    },
    {
        "doc_id": "ESC-002",
        "doc_type": "escalation_policy",
        "line_id": None,
        "entity_id": None,
        "text": "This policy dictates the mandatory communication structure when material stock-out risks escalate across predefined severity thresholds. Upon reaching a MEDIUM severity hint (stock_days_remaining < 5), automated alerts are dispatched to the shift supervisor and lead procurement officer for initial assessment. If the situation escalates to a HIGH severity (stock < 3 days), the regional supply chain director must be paged directly, and an emergency procurement meeting is convened. A CRITICAL severity event triggers immediate notification to the VP of Operations and authorises the release of emergency discretionary funds for expedited freight."
    },
    {
        "doc_id": "SOP-GEN-01",
        "doc_type": "sop",
        "line_id": None,
        "entity_id": None,
        "text": "This standard operating procedure covers the baseline shift handover protocols for all active manufacturing lines. Outgoing supervisors must log all active warnings and unresolved anomalies in the central digital logbook prior to departure. Incoming supervisors are required to review the previous 12 hours of telemetry logs and physically verify the operational status of all critical machinery within the first 30 minutes of their shift."
    },
    {
        "doc_id": "SAF-GEN-01",
        "doc_type": "safety_policy",
        "line_id": None,
        "entity_id": None,
        "text": "The facility-wide safety policy mandates that all personnel on the active manufacturing floor must wear approved Class-2 high-visibility vests, steel-toed footwear, and impact-resistant safety glasses at all times. Any individual operating within 10 meters of an active curing press or automated material handler must also utilize hearing protection rated for at least 25 decibel reduction. Violations of these safety protocols will result in immediate removal from the active floor and a formal disciplinary review."
    },
    {
        "doc_id": "PLAY-GEN-01",
        "doc_type": "response_playbook",
        "line_id": None,
        "entity_id": None,
        "text": "In the event of a facility-wide power fluctuation or unexpected brief outage, all automated lines will enter a default fail-safe lock state. Operators must manually cycle the primary breaker for each machine zone only after the central facility UPS confirms stable grid voltage for a continuous 5-minute period. Once power is verified, the quality assurance team must perform a manual sample test of the first 50 units produced on each line to ensure the interruption did not cause unseen recalibration errors."
    },
    {
        "doc_id": "ESC-GEN-01",
        "doc_type": "escalation_policy",
        "line_id": None,
        "entity_id": None,
        "text": "This general escalation matrix defines the mandatory notification protocols for all operational disruptions based on assessed severity, independent of the specific incident type. When an incident is classified as CRITICAL, the automated monitoring system must immediately page the plant manager and initiate a facility-wide emergency broadcast. For HIGH severity incidents, the designated shift supervisor and the engineering lead must be notified within 5 minutes via direct text alert to formulate an immediate intervention strategy. For MEDIUM severity anomalies, the system will log the event in the central dashboard and notify the shift lead during the next hourly review cycle without triggering active alarms."
    }
]
