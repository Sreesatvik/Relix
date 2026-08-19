import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert } from '../types';
import { ShieldAlert, AlertTriangle, ArrowRight, X, Radio } from 'lucide-react';

interface LiveAlertToastProps {
  alert: Alert | null;
  onDismiss: () => void;
}

export const LiveAlertToast: React.FC<LiveAlertToastProps> = ({ alert, onDismiss }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!alert) return null;

  const isCritical = alert.severity.toUpperCase() === 'CRITICAL';

  const handleNavigateToIncident = () => {
    // Navigate to current route preserving or appending the incident query param
    const currentPath = location.pathname || '/manager';
    navigate(`${currentPath}?incident=${alert.incident_id}`);
    onDismiss();
  };

  return (
    <div
      id={`live-alert-toast-${alert.alert_id}`}
      className="fixed top-16 right-4 sm:right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
    >
      <div
        className={`p-4 border-2 ${
          isCritical
            ? 'bg-red-950 border-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.4)]'
            : 'bg-amber-950 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]'
        } flex flex-col gap-2 relative`}
      >
        {/* Top bar with alert badge and dismiss button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <span
              className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border ${
                isCritical
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-amber-500 border-amber-300 text-black'
              }`}
            >
              LIVE DISRUPTION ALERT // {alert.severity}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              [{alert.alert_id}]
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            title="Dismiss Alert"
            className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Click-through */}
        <div
          onClick={handleNavigateToIncident}
          className="cursor-pointer group space-y-1 hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 inline" />
              <span>Incident Trigger: {alert.incident_id}</span>
            </p>
            <span className="text-xs font-mono text-zinc-300 group-hover:text-white flex items-center gap-1 font-bold underline">
              <span>Inspect</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          <p className="text-xs font-mono text-zinc-300">
            Routed Roles:{' '}
            <strong className="text-white">
              {alert.routed_roles.map((r) => r.replace('_', ' ')).join(', ')}
            </strong>
          </p>

          <p className="text-[10px] font-mono text-zinc-400 pt-1 flex justify-between">
            <span>Fired At: {alert.created_at}</span>
            <span className="italic text-zinc-400">Click to view details</span>
          </p>
        </div>
      </div>
    </div>
  );
};
