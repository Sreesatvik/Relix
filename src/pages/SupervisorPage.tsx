import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import incidentsData from '../../frontend/mocks/incidents.json';
import { DisruptionIncident } from '../types';
import { DomainFilter, DomainFilterOption } from '../components/DomainFilter';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronRight,
  Radio,
  FileText,
} from 'lucide-react';

export const SupervisorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<DisruptionIncident[]>(
    incidentsData as DisruptionIncident[]
  );
  const [selectedLine, setSelectedLine] = useState<string>('LINE-4');
  const [selectedDomain, setSelectedDomain] = useState<DomainFilterOption>('All');

  // Read incident query from URL
  const incidentQueryId = searchParams.get('incident');

  // Available lines
  const availableLines = useMemo(() => {
    const lines = Array.from(new Set(incidents.map((i) => i.line_id)));
    return lines.length > 0 ? lines : ['LINE-4', 'LINE-2'];
  }, [incidents]);

  // Compute domain count statistics for filter pills
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents
      .filter((inc) => inc.line_id === selectedLine)
      .forEach((inc) => {
        inc.domain_mix.forEach((dm) => {
          const key = dm.toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        });
      });
    return counts;
  }, [incidents, selectedLine]);

  // Filtered by selected line & domain filter
  const filteredIncidents = useMemo(() => {
    let list = incidents.filter((inc) => inc.line_id === selectedLine);

    if (selectedDomain !== 'All') {
      const targetDomain = selectedDomain.toLowerCase();
      list = list.filter((inc) =>
        inc.domain_mix.some((dm) => dm.toLowerCase() === targetDomain)
      );
    }

    return list;
  }, [incidents, selectedLine, selectedDomain]);

  // Active incident
  const activeIncident = useMemo(() => {
    if (incidentQueryId) {
      const found = incidents.find((i) => i.incident_id === incidentQueryId);
      if (found) {
        // If incident is on another line, automatically match line
        if (found.line_id !== selectedLine) {
          setSelectedLine(found.line_id);
        }
        return found;
      }
    }
    return filteredIncidents[0] || incidents[0] || null;
  }, [incidentQueryId, incidents, filteredIncidents, selectedLine]);

  // Sync URL when active incident is determined
  useEffect(() => {
    if (!incidentQueryId && activeIncident) {
      setSearchParams({ incident: activeIncident.incident_id }, { replace: true });
    }
  }, [activeIncident, incidentQueryId, setSearchParams]);

  const handleSelectIncident = (id: string) => {
    setSearchParams({ incident: id });
  };

  const handleUpdateStatus = (incidentId: string, newStatus: 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED') => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.incident_id === incidentId ? { ...inc, status: newStatus } : inc
      )
    );
  };

  const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RESOLVED':
        return {
          text: 'RESOLVED',
          badge: 'bg-emerald-600 text-white border-emerald-400',
        };
      case 'ESCALATED':
        return {
          text: 'ESCALATED',
          badge: 'bg-red-600 text-white border-red-400 animate-pulse',
        };
      case 'ACKNOWLEDGED':
        return {
          text: 'ACKNOWLEDGED',
          badge: 'bg-cyan-600 text-white border-cyan-400',
        };
      case 'OPEN':
      default:
        return {
          text: 'OPEN',
          badge: 'bg-zinc-800 text-amber-400 border-amber-500/50',
        };
    }
  };

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
          badge: 'bg-amber-500 text-black border-amber-400 font-bold',
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
        {/* Header with Line Selector */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-white/20 pb-4 gap-4">
          <div>
            <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              SHOP FLOOR SUPERVISION // TACTICAL DISRUPTION DISPATCH
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mt-1">
              Supervisor Console
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900 border border-white/20 p-2.5">
            <label
              htmlFor="line-select"
              className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-zinc-300 whitespace-nowrap"
            >
              Select Line:
            </label>
            <select
              id="line-select"
              value={selectedLine}
              onChange={(e) => {
                setSelectedLine(e.target.value);
              }}
              className="bg-black border border-white/30 text-white font-mono font-black text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              {availableLines.map((line) => (
                <option key={line} value={line} className="bg-zinc-900 text-white">
                  {line}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Domain Filter & Filtered Incidents */}
          <div className="lg:col-span-5 space-y-4">
            {/* Requirement 1: DOMAIN FILTER above incident list */}
            <DomainFilter
              selectedDomain={selectedDomain}
              onSelectDomain={setSelectedDomain}
              domainCounts={domainCounts}
            />

            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                {selectedLine} Incidents ({filteredIncidents.length})
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                ACTIVE MONITORING
              </span>
            </div>

            <div className="space-y-3">
              {filteredIncidents.length === 0 ? (
                <div className="p-8 border border-zinc-800 bg-zinc-900/50 text-center font-mono text-zinc-400 text-sm">
                  No active incidents for {selectedLine} matching domain "{selectedDomain}".
                </div>
              ) : (
                filteredIncidents.map((incident) => {
                  const isSelected = activeIncident?.incident_id === incident.incident_id;
                  const styles = getRiskLevelStyles(incident.risk_level);
                  const statusInfo = getStatusBadge(incident.status);

                  return (
                    <div
                      key={incident.incident_id}
                      id={`supervisor-card-${incident.incident_id}`}
                      onClick={() => handleSelectIncident(incident.incident_id)}
                      className={`p-5 border-2 transition-all cursor-pointer select-none ${
                        isSelected
                          ? `bg-zinc-900 ${styles.border} ${styles.glow} ring-1 ring-white/30`
                          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black font-mono tracking-tight text-white uppercase">
                            {incident.line_id}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            [{incident.incident_id}]
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${statusInfo.badge}`}
                          >
                            {statusInfo.text}
                          </span>
                          <span
                            className={`text-xs font-mono font-black uppercase px-2 py-0.5 border ${styles.badge}`}
                          >
                            {incident.risk_level}
                          </span>
                        </div>
                      </div>

                      <div className="my-3 bg-black/60 border border-white/10 p-3 flex justify-between items-baseline">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            Estimated Cost Exposure
                          </p>
                          <p className="text-3xl font-black text-white tracking-tighter leading-none mt-1">
                            {formatINR(incident.decision.business_impact.estimated_cost_inr)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase">
                            Risk Score
                          </p>
                          <p className="text-lg font-mono font-black text-zinc-200">
                            {(incident.risk_score * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {incident.domain_mix.map((dm) => (
                            <span
                              key={dm}
                              className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-mono uppercase"
                            >
                              {dm}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            id={`btn-ack-${incident.incident_id}`}
                            onClick={() => handleUpdateStatus(incident.incident_id, 'ACKNOWLEDGED')}
                            className={`text-[10px] font-mono font-bold px-2 py-1 uppercase border transition-colors cursor-pointer ${
                              incident.status === 'ACKNOWLEDGED'
                                ? 'bg-cyan-600 border-cyan-400 text-white'
                                : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            Ack
                          </button>
                          <button
                            type="button"
                            id={`btn-esc-${incident.incident_id}`}
                            onClick={() => handleUpdateStatus(incident.incident_id, 'ESCALATED')}
                            className={`text-[10px] font-mono font-bold px-2 py-1 uppercase border transition-colors cursor-pointer ${
                              incident.status === 'ESCALATED'
                                ? 'bg-red-600 border-red-400 text-white'
                                : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            Escalate
                          </button>
                          <button
                            type="button"
                            id={`btn-res-${incident.incident_id}`}
                            onClick={() => handleUpdateStatus(incident.incident_id, 'RESOLVED')}
                            className={`text-[10px] font-mono font-bold px-2 py-1 uppercase border transition-colors cursor-pointer ${
                              incident.status === 'RESOLVED'
                                ? 'bg-emerald-600 border-emerald-400 text-white'
                                : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            Resolve
                          </button>
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
                id={`supervisor-detail-${activeIncident.incident_id}`}
                className="border-2 border-white/20 bg-zinc-900 p-6 sm:p-8 space-y-6 sticky top-20 shadow-2xl"
              >
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-white/15 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500 text-black font-black text-xs font-mono px-2 py-0.5 uppercase">
                      LINE {activeIncident.line_id}
                    </span>
                    <span className="text-lg font-mono font-black text-white">
                      {activeIncident.incident_id}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold uppercase px-2.5 py-0.5 border ${
                        getStatusBadge(activeIncident.status).badge
                      }`}
                    >
                      STATUS: {activeIncident.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="detail-btn-acknowledge"
                      onClick={() => handleUpdateStatus(activeIncident.incident_id, 'ACKNOWLEDGED')}
                      className={`flex items-center gap-1.5 text-xs font-mono font-black uppercase px-3 py-1.5 border transition-all cursor-pointer ${
                        activeIncident.status === 'ACKNOWLEDGED'
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>

                    <button
                      type="button"
                      id="detail-btn-escalate"
                      onClick={() => handleUpdateStatus(activeIncident.incident_id, 'ESCALATED')}
                      className={`flex items-center gap-1.5 text-xs font-mono font-black uppercase px-3 py-1.5 border transition-all cursor-pointer ${
                        activeIncident.status === 'ESCALATED'
                          ? 'bg-red-600 text-white border-red-400 shadow-md'
                          : 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Escalate
                    </button>

                    <button
                      type="button"
                      id="detail-btn-resolve"
                      onClick={() => handleUpdateStatus(activeIncident.incident_id, 'RESOLVED')}
                      className={`flex items-center gap-1.5 text-xs font-mono font-black uppercase px-3 py-1.5 border transition-all cursor-pointer ${
                        activeIncident.status === 'RESOLVED'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  </div>
                </div>

                {/* Requirement 2: role_summaries.supervisor headline */}
                <div className="bg-amber-500/10 border-l-8 border-amber-500 p-5 sm:p-6">
                  <p className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-400 inline" />
                    Line Supervisor Directive
                  </p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-snug">
                    "{activeIncident.role_summaries.supervisor}"
                  </p>
                </div>

                <div className="border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                        Operational Action Plan ({activeIncident.decision.recommended_action.sop_reference})
                      </span>
                    </div>

                    {activeIncident.decision.recommended_action.escalation_required && (
                      <span className="text-[10px] font-mono bg-red-600 text-white px-2 py-0.5 font-bold uppercase">
                        REQUIRES MANAGER ESCALATION
                      </span>
                    )}
                  </div>

                  <p className="text-lg font-black text-white tracking-tight uppercase">
                    {activeIncident.decision.recommended_action.action.replace(/_/g, ' ')}
                  </p>

                  <p className="text-zinc-300 text-sm leading-relaxed">
                    <strong>Tactical Reason:</strong> {activeIncident.decision.recommended_action.reason}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Radio className="w-4 h-4 text-zinc-400" />
                    Real-time Sensor Signals ({activeIncident.signals.length})
                  </h3>

                  <div className="space-y-2">
                    {activeIncident.signals.map((sig) => (
                      <div
                        key={sig.signal_id}
                        className="bg-black/50 border border-white/10 p-3.5 font-mono text-xs space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-amber-400 font-bold">
                            [{sig.domain.toUpperCase()}] {sig.entity_id} — {sig.metric_name}
                          </span>
                          <span className="text-[10px] text-zinc-400">{sig.timestamp}</span>
                        </div>

                        <div className="flex items-baseline gap-3">
                          <span className="text-base font-black text-white">
                            Value: {sig.value}
                          </span>
                          <span className="text-zinc-400">
                            Threshold: {sig.threshold}
                          </span>
                          <span className="text-red-400 font-bold">
                            [{sig.severity_hint}]
                          </span>
                        </div>

                        <p className="text-zinc-300 italic text-[11px]">
                          Note: "{sig.text_note}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2 text-xs font-mono text-zinc-400">
                  <div className="flex items-start gap-2">
                    <strong className="text-zinc-200 shrink-0">ROOT CAUSE:</strong>
                    <span className="text-zinc-300">{activeIncident.diagnostic.root_cause}</span>
                  </div>
                  <p className="text-zinc-400 italic text-[11px] leading-relaxed">
                    {activeIncident.diagnostic.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12 border-2 border-dashed border-zinc-800 text-center font-mono text-zinc-500">
                Select an incident from {selectedLine} to view supervisor controls.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
