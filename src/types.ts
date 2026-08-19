export interface DisruptionSignal {
  signal_id: string;
  domain: string;
  entity_id: string;
  line_id: string;
  timestamp: string;
  metric_name: string;
  value: number;
  threshold: number;
  severity_hint: string;
  text_note: string;
}

export interface DiagnosticEvidence {
  source_type: string;
  doc_id: string;
  snippet: string;
}

export interface Diagnostic {
  root_cause: string;
  evidence: DiagnosticEvidence[];
  explanation: string;
}

export interface BusinessImpact {
  units_at_risk: number;
  orders_at_risk: number;
  delivery_delay_hours: number;
  estimated_cost_inr: number;
  severity: string;
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
  sop_reference: string;
  escalation_required: boolean;
}

export interface Decision {
  business_impact: BusinessImpact;
  what_if: WhatIfScenario[];
  recommended_action: RecommendedAction;
}

export interface RoleSummaries {
  plant_manager: string | null;
  supervisor: string | null;
  maintenance: string | null;
  quality: string | null;
  materials: string | null;
  workforce: string | null;
}

export interface DisruptionIncident {
  incident_id: string;
  created_at: string;
  domain_mix: string[];
  line_id: string;
  risk_score: number;
  risk_level: string;
  status: string;
  signals: DisruptionSignal[];
  diagnostic: Diagnostic;
  decision: Decision;
  role_summaries: RoleSummaries;
}

export interface Alert {
  alert_id: string;
  incident_id: string;
  severity: string;
  routed_roles: string[];
  created_at: string;
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

