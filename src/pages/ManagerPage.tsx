import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import incidentsData from '../../frontend/mocks/incidents.json';
import { DisruptionIncident } from '../types';
import { DomainFilter, DomainFilterOption } from '../components/DomainFilter';
import {
  ShieldAlert,
  TrendingDown,
  Clock,
  CheckCircle2,
  Filter,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const ManagerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [criticalOnly, setCriticalOnly] = useState<boolean>(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainFilterOption>('All');

  // Parse current incident ID from URL query
  const incidentQueryId = searchParams.get('incident');

  // Load and sort incidents client-side by (risk_score * estimated_cost_inr) descending
  const sortedIncidents = useMemo(() => {
    const data = [...(incidentsData as DisruptionIncident[])];
    return data.sort((a, b) => {
      const exposureA = a.risk_score * a.decision.business_impact.estimated_cost_inr;
      const exposureB = b.risk_score * b.decision.business_impact.estimated_cost_inr;
      return exposureB - exposureA;
    });
  }, []);

  // Compute domain count statistics for filter pills
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sortedIncidents.forEach((inc) => {
      inc.domain_mix.forEach((dm) => {
        const key = dm.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }, [sortedIncidents]);

  // Filtered by both Domain Filter & Critical Toggle
  const displayedIncidents = useMemo(() => {
    let list = sortedIncidents;

    if (criticalOnly) {
      list = list.filter((inc) => inc.risk_level === 'CRITICAL');
    }

    if (selectedDomain !== 'All') {
      const targetDomain = selectedDomain.toLowerCase();
      list = list.filter((inc) =>
        inc.domain_mix.some((dm) => dm.toLowerCase() === targetDomain)
      );
    }

    return list;
  }, [sortedIncidents, criticalOnly, selectedDomain]);

  // Active selected incident
  const activeIncident = useMemo(() => {
    if (incidentQueryId) {
      const found = sortedIncidents.find((i) => i.incident_id === incidentQueryId);
      if (found) return found;
    }
    return displayedIncidents[0] || sortedIncidents[0] || null;
  }, [incidentQueryId, displayedIncidents, sortedIncidents]);

  // Sync URL when active incident changes if not set
  useEffect(() => {
    if (!incidentQueryId && activeIncident) {
      setSearchParams({ incident: activeIncident.incident_id }, { replace: true });
    }
  }, [activeIncident, incidentQueryId, setSearchParams]);

  const handleSelectIncident = (id: string) => {
    setSearchParams({ incident: id });
  };

  // Format INR currency
  const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  // Risk style helper
  const getRiskLevelStyles = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-600 text-white border-red-500',
          border: 'border-red-600',
          glow: 'shadow-[0_0_15px_rgba(220,38,38,0.25)]',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-600 text-white border-orange-500',
          border: 'border-orange-500',
          glow: 'shadow-[0_0_10px_rgba(249,115,22,0.2)]',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-amber-500 text-black border-amber-400 font-black',
          border: 'border-amber-500',
          glow: '',
        };
      case 'LOW':
      default:
        return {
          badge: 'bg-emerald-600 text-white border-emerald-500',
          border: 'border-emerald-500',
          glow: '',
        };
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#0A0A0A] text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header with Critical Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-white/20 pb-4 gap-4">
          <div>
            <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              EXECUTIVE DISRUPTION DASHBOARD // CROSS-LINE OVERSIGHT
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mt-1">
              Plant Manager Console
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900 border border-white/20 p-2.5">
            <Filter className="w-4 h-4 text-zinc-400" />
            <label
              htmlFor="critical-only-toggle"
              className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-zinc-300 cursor-pointer select-none"
            >
              Critical Only
            </label>
            <button
              type="button"
              id="critical-only-toggle"
              role="switch"
              aria-checked={criticalOnly}
              onClick={() => setCriticalOnly(!criticalOnly)}
              className={`w-12 h-6 flex items-center p-0.5 transition-colors cursor-pointer border ${
                criticalOnly
                  ? 'bg-red-600 border-red-400 justify-end'
                  : 'bg-zinc-800 border-zinc-600 justify-start'
              }`}
            >
              <span className="w-4.5 h-4.5 bg-white shadow-md transform transition-transform" />
            </button>
            {criticalOnly && (
              <span className="text-[10px] font-mono font-black text-red-400 tracking-wider">
                FILTER ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Domain Filter & Incident List */}
          <div className="lg:col-span-5 space-y-4">
            {/* Requirement 1: DOMAIN FILTER above incident list */}
            <DomainFilter
              selectedDomain={selectedDomain}
              onSelectDomain={setSelectedDomain}
              domainCounts={domainCounts}
            />

            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                Visible Incidents ({displayedIncidents.length})
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                SORT: RISK × EXPOSURE DESC
              </span>
            </div>

            <div className="space-y-3">
              {displayedIncidents.length === 0 ? (
                <div className="p-8 border border-zinc-800 bg-zinc-900/50 text-center font-mono text-zinc-400 text-sm">
                  No incidents match the domain filter "{selectedDomain}".
                </div>
              ) : (
                displayedIncidents.map((incident) => {
                  const isSelected = activeIncident?.incident_id === incident.incident_id;
                  const styles = getRiskLevelStyles(incident.risk_level);
                  const financialExposure =
                    incident.risk_score * incident.decision.business_impact.estimated_cost_inr;

                  return (
                    <div
                      key={incident.incident_id}
                      id={`incident-card-${incident.incident_id}`}
                      onClick={() => handleSelectIncident(incident.incident_id)}
                      className={`p-5 border-2 transition-all cursor-pointer select-none relative ${
                        isSelected
                          ? `bg-zinc-900 ${styles.border} ${styles.glow} ring-1 ring-white/30`
                          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl font-black tracking-tight text-white uppercase font-mono">
                            {incident.line_id}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            [{incident.incident_id}]
                          </span>
                        </div>

                        <span
                          className={`text-xs font-mono font-black uppercase px-2.5 py-0.5 border ${styles.badge}`}
                        >
                          {incident.risk_level} ({(incident.risk_score * 100).toFixed(0)}%)
                        </span>
                      </div>

                      <div className="my-3 bg-black/60 border border-white/10 p-3 flex justify-between items-baseline">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            Estimated Cost Exposure
                          </p>
                          <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none mt-1">
                            {formatINR(incident.decision.business_impact.estimated_cost_inr)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase">
                            Risk Exposure Index
                          </p>
                          <p className="text-sm font-mono font-bold text-zinc-300">
                            {formatINR(Math.round(financialExposure))}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 uppercase text-[10px]">Domains:</span>
                          {incident.domain_mix.map((dm) => (
                            <span
                              key={dm}
                              className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-semibold uppercase"
                            >
                              {dm}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 text-zinc-400">
                          <span>{incident.status}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Incident Detail Panel */}
          <div className="lg:col-span-7">
            {activeIncident ? (
              <div
                id={`incident-detail-${activeIncident.incident_id}`}
                className="border-2 border-white/20 bg-zinc-900 p-6 sm:p-8 space-y-6 sticky top-20 shadow-2xl"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/15 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-red-600 text-black font-black text-xs font-mono px-2 py-0.5 uppercase">
                      ACTIVE INCIDENT
                    </span>
                    <span className="text-lg font-mono font-black text-white">
                      {activeIncident.incident_id} // {activeIncident.line_id}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    DETECTED: {activeIncident.created_at}
                  </span>
                </div>

                {/* Requirement: role_summaries.plant_manager headline */}
                <div className="bg-red-600/10 border-l-8 border-red-600 p-5 sm:p-6">
                  <p className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-500 inline" />
                    Plant Manager Executive Summary
                  </p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-snug">
                    "{activeIncident.role_summaries.plant_manager}"
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-white/10 p-4 bg-black/40">
                  <div>
                    <p className="text-[10px] font-mono text-zinc-400 uppercase">Units at Risk</p>
                    <p className="text-2xl font-black text-white tracking-tight">
                      {activeIncident.decision.business_impact.units_at_risk.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-zinc-400 uppercase">Orders at Risk</p>
                    <p className="text-2xl font-black text-white tracking-tight">
                      {activeIncident.decision.business_impact.orders_at_risk}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-zinc-400 uppercase">Delivery Delay</p>
                    <p className="text-2xl font-black text-red-400 tracking-tight flex items-baseline gap-1">
                      {activeIncident.decision.business_impact.delivery_delay_hours}
                      <span className="text-xs font-mono text-zinc-400">hrs</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-zinc-400 uppercase">Financial Impact</p>
                    <p className="text-2xl font-black text-red-500 tracking-tight">
                      {formatINR(activeIncident.decision.business_impact.estimated_cost_inr)}
                    </p>
                  </div>
                </div>

                {/* What-If Comparison Table */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-zinc-400" />
                      What-If Scenario Decision Matrix
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500">
                      COMPARATIVE TRADE-OFF MODEL
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-white/15">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-zinc-800/80 border-b border-white/20 text-[11px] font-mono uppercase text-zinc-300">
                          <th className="p-3">Action Protocol</th>
                          <th className="p-3 text-right">Units Lost</th>
                          <th className="p-3 text-right">Cost (INR)</th>
                          <th className="p-3 text-right">Delay (Hours)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 font-mono">
                        {activeIncident.decision.what_if.map((scenario, index) => {
                          const isDoNothing = scenario.action.toUpperCase() === 'DO_NOTHING';
                          const isRecommended =
                            scenario.action ===
                            activeIncident.decision.recommended_action.action;

                          let rowClasses = 'bg-zinc-900/40 text-zinc-300';
                          let badge = null;

                          if (isDoNothing) {
                            rowClasses =
                              'bg-red-950/40 text-red-300 border-l-4 border-red-600 font-semibold';
                            badge = (
                              <span className="ml-2 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.2 uppercase">
                                WORST CASE
                              </span>
                            );
                          } else if (isRecommended) {
                            rowClasses =
                              'bg-emerald-950/50 text-emerald-300 border-l-4 border-emerald-500 font-bold';
                            badge = (
                              <span className="ml-2 text-[9px] font-bold bg-emerald-500 text-black px-1.5 py-0.2 uppercase">
                                RECOMMENDED
                              </span>
                            );
                          }

                          return (
                            <tr key={index} className={`${rowClasses} transition-colors`}>
                              <td className="p-3 font-mono font-bold tracking-tight text-white flex items-center">
                                {scenario.action.replace(/_/g, ' ')}
                                {badge}
                              </td>
                              <td className="p-3 text-right">
                                {scenario.units_lost.toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 text-right font-bold">
                                {formatINR(scenario.cost_inr)}
                              </td>
                              <td className="p-3 text-right">{scenario.delay_hours}h</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommended Action Plan */}
                <div className="border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                        AI Recommended Action Plan
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-black/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-0.5 font-bold">
                        SOP: {activeIncident.decision.recommended_action.sop_reference}
                      </span>
                      {activeIncident.decision.recommended_action.escalation_required && (
                        <span className="text-[10px] font-mono bg-red-600 text-white px-2 py-0.5 font-bold uppercase">
                          ESCALATION REQUIRED
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-lg font-black text-white tracking-tight uppercase">
                    {activeIncident.decision.recommended_action.action.replace(/_/g, ' ')}
                  </p>

                  <p className="text-zinc-300 text-sm leading-relaxed">
                    <strong>Reasoning:</strong> {activeIncident.decision.recommended_action.reason}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2 text-xs font-mono text-zinc-400">
                  <div className="flex items-start gap-2">
                    <strong className="text-zinc-200 shrink-0">DIAGNOSTIC ROOT CAUSE:</strong>
                    <span className="text-zinc-300">{activeIncident.diagnostic.root_cause}</span>
                  </div>
                  <p className="text-zinc-400 italic text-[11px] leading-relaxed">
                    {activeIncident.diagnostic.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12 border-2 border-dashed border-zinc-800 text-center font-mono text-zinc-500">
                Select an incident from the list to view details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
