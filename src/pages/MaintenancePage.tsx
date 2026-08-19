import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import incidentsData from '../../frontend/mocks/incidents.json';
import { DisruptionIncident } from '../types';
import { DomainFilter, DomainFilterOption } from '../components/DomainFilter';
import {
  Wrench,
  AlertTriangle,
  FileCheck2,
  Cpu,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<DisruptionIncident[]>(
    incidentsData as DisruptionIncident[]
  );
  const [selectedDomain, setSelectedDomain] = useState<DomainFilterOption>('All');
  const [acknowledgedCards, setAcknowledgedCards] = useState<Record<string, boolean>>({});

  const incidentQueryId = searchParams.get('incident');

  // Compute domain count statistics for filter pills
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((inc) => {
      inc.domain_mix.forEach((dm) => {
        const key = dm.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }, [incidents]);

  // Filter incidents by domain
  const filteredIncidents = useMemo(() => {
    if (selectedDomain === 'All') return incidents;
    const targetDomain = selectedDomain.toLowerCase();
    return incidents.filter((inc) =>
      inc.domain_mix.some((dm) => dm.toLowerCase() === targetDomain)
    );
  }, [incidents, selectedDomain]);

  const handleSelectIncident = (id: string) => {
    setSearchParams({ incident: id });
  };

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getRiskLevelStyles = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-600 text-white border-red-500',
          border: 'border-red-600',
          glow: 'shadow-[0_0_20px_rgba(220,38,38,0.2)]',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-600 text-white border-orange-500',
          border: 'border-orange-500',
          glow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-white/20 pb-4 gap-4">
          <div>
            <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              PLANT ASSET RELIABILITY // MACHINE HEALTH & WORK ORDERS
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none mt-1">
              Maintenance Engineering
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900 border border-white/20 px-3 py-2 font-mono text-xs text-zinc-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>ACTIVE WORK QUEUE: {filteredIncidents.length} ASSETS</span>
          </div>
        </div>

        {/* Requirement 1: DOMAIN FILTER above incident list */}
        <DomainFilter
          selectedDomain={selectedDomain}
          onSelectDomain={setSelectedDomain}
          domainCounts={domainCounts}
        />

        {/* Machine-Centric Incident Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {filteredIncidents.length === 0 ? (
            <div className="col-span-full p-12 border border-zinc-800 bg-zinc-900/50 text-center font-mono text-zinc-400 text-sm">
              No maintenance incidents match the domain filter "{selectedDomain}".
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isSelected = incidentQueryId === incident.incident_id;
              const styles = getRiskLevelStyles(incident.risk_level);
              const isAcked = acknowledgedCards[incident.incident_id];
              const hasMaintenanceDirective = Boolean(incident.role_summaries.maintenance);

              return (
                <div
                  key={incident.incident_id}
                  id={`maintenance-card-${incident.incident_id}`}
                  onClick={() => handleSelectIncident(incident.incident_id)}
                  className={`border-2 ${styles.border} ${
                    isSelected ? 'ring-2 ring-white scale-[1.01] shadow-2xl' : ''
                  } ${styles.glow} bg-zinc-900 flex flex-col justify-between transition-all cursor-pointer`}
                >
                  <div className="p-6 sm:p-7 space-y-5">
                    {/* Top Bar: Line ID, ID, Risk Level */}
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Wrench className="w-5 h-5 text-zinc-400" />
                        <span className="text-xl font-black font-mono tracking-tight text-white uppercase">
                          {incident.line_id}
                        </span>
                        <span className="text-xs font-mono text-zinc-400">
                          [{incident.incident_id}]
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono bg-white text-black font-black px-1.5 py-0.2 uppercase">
                            SELECTED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-black uppercase px-2.5 py-0.5 border ${styles.badge}`}
                        >
                          {incident.risk_level} ({(incident.risk_score * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    {/* Requirement: diagnostic.root_cause as card headline */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                        DIAGNOSED ROOT CAUSE
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight">
                        {incident.diagnostic.root_cause}
                      </h2>
                    </div>

                    {/* Requirement: role_summaries.maintenance as main body text */}
                    <div className="bg-black/60 border border-white/15 p-4 sm:p-5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1.5 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Maintenance Directive & Work Order Note
                      </p>
                      <p className="text-base sm:text-lg font-bold text-zinc-100 leading-relaxed">
                        {hasMaintenanceDirective
                          ? incident.role_summaries.maintenance
                          : 'No active mechanical repairs logged for this incident. Machine sensors operating within normal thresholds.'}
                      </p>
                    </div>

                    {/* Requirement: diagnostic.evidence rendered as small list showing source_type and snippet */}
                    <div className="space-y-2.5 pt-1">
                      <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-zinc-400" />
                        Diagnostic Evidence Stream ({incident.diagnostic.evidence.length})
                      </p>

                      <div className="space-y-2">
                        {incident.diagnostic.evidence.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs space-y-1"
                          >
                            <div className="flex justify-between items-center text-[10px] text-zinc-400">
                              <span className="font-bold text-amber-400 uppercase">
                                SOURCE: {item.source_type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-zinc-500">REF: {item.doc_id}</span>
                            </div>
                            <p className="text-zinc-300 font-sans text-xs italic">
                              "{item.snippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Machine Sensor Signals Preview */}
                    {incident.signals.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-1.5">
                        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                          Active Telemetry Triggers:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {incident.signals.map((sig) => (
                            <span
                              key={sig.signal_id}
                              className="text-[11px] font-mono bg-zinc-800 px-2 py-1 border border-zinc-700 text-zinc-200"
                            >
                              <span className="text-zinc-400">{sig.metric_name}:</span>{' '}
                              <strong className="text-white">{sig.value}</strong>{' '}
                              <span className="text-red-400 font-semibold">
                                (&gt;{sig.threshold})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 flex justify-between items-center gap-3">
                    <span className="text-[11px] font-mono text-zinc-400">
                      SOP: {incident.decision.recommended_action.sop_reference}
                    </span>

                    <button
                      type="button"
                      id={`btn-maint-ack-${incident.incident_id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAcknowledge(incident.incident_id);
                      }}
                      className={`px-4 py-2 text-xs font-mono font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                        isAcked
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600'
                      }`}
                    >
                      {isAcked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Work Order Queued</span>
                        </>
                      ) : (
                        <>
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Dispatch Tech</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
