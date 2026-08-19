// ── Signal ─────────────────────────────────────────────────
export interface DisruptionSignal {
  signal_id: string;
  domain: string;
  entity_id: string;
  line_id: string;
  timestamp: string;           // ISO string from backend datetime
  metric_name: string;
  value: number;
  threshold: number;
  severity_hint: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  text_note: string | null;    // Optional[str] in Python — can be null
}

// ── Diagnostic ─────────────────────────────────────────────
export interface DiagnosticEvidence {
  source_type: string;
  doc_id: string;
  snippet: string;
}

export interface PredictionInfo {
  time_to_failure_hours: number | null;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  trend_direction: 'rising' | 'stable' | 'falling';
  trend_description: string;
  historical_match: string | null;
}

export interface Diagnostic {
  root_cause: string;
  evidence: DiagnosticEvidence[];
  explanation: string;
  prediction: PredictionInfo;
}

// ── Decision ───────────────────────────────────────────────
export interface BusinessImpact {
  units_at_risk: number;
  orders_at_risk: number;
  delivery_delay_hours: number;
  estimated_cost_inr: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface WhatIfScenario {
  action: string;
  units_lost: number;
  cost_inr: number;
  delay_hours: number;
}

export interface RecommendedAction {
  action: string;
  reason: string;
  sop_reference: string | null;  // Optional[str] in Python — can be null
  escalation_required: boolean;
}

export interface Decision {
  business_impact: BusinessImpact;
  what_if: WhatIfScenario[];
  recommended_action: RecommendedAction;
}

// ── Role Summaries ─────────────────────────────────────────
export interface RoleSummaries {
  plant_manager: string | null;
  supervisor: string | null;
  maintenance: string | null;
  quality: string | null;
  materials: string | null;
  workforce: string | null;
  [key: string]: string | null;  // allow extra keys from backend Dict
}

// ── Incident ───────────────────────────────────────────────
export interface DisruptionIncident {
  incident_id: string;
  created_at: string;           // ISO string from backend datetime
  domain_mix: string[];
  line_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  signals: DisruptionSignal[];
  diagnostic: Diagnostic | null;      // Optional in backend
  decision: Decision | null;          // Optional in backend
  role_summaries: RoleSummaries | null; // Optional in backend
}

// ── Alert ──────────────────────────────────────────────────
export interface Alert {
  alert_id: string;
  incident_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  routed_roles: string[];
  created_at: string;          // ISO string from backend datetime
}


export type RiskLevel = 'CRITICAL' | 'WARNING' | 'NOMINAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DisruptionAlert {
  id: string;
  line: string;
  title: string;
  detail: string;
  eta: string;
  confidence: number;
  level: RiskLevel;
  timestamp: string;
  category?: 'SUPPLY_CHAIN' | 'THERMAL' | 'MECHANICAL' | 'LOGISTICS' | 'OPERATIONAL';
}

export interface PlantMetric {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  status?: 'nominal' | 'warning' | 'critical';
}

export interface PredictionBar {
  timeLabel: string;
  riskScore: number;
  isPeak?: boolean;
}

