import React from 'react';
import { DisruptionAlert } from '../types';
import { Clock, ShieldAlert, Zap } from 'lucide-react';

interface AlertsFeedProps {
  alerts: DisruptionAlert[];
  onAcknowledge?: (id: string) => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts, onAcknowledge }) => {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          High Priority Disruption Alerts ({alerts.length})
        </h2>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          SORT: SEVERITY DESC
        </span>
      </div>

      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {alerts.map((alert) => {
          const isCritical = alert.level === 'CRITICAL';
          const isWarning = alert.level === 'WARNING';

          const cardBorder = isCritical
            ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
            : isWarning
            ? 'border-amber-500'
            : 'border-zinc-800 opacity-75';

          const tagColor = isCritical
            ? 'text-red-500'
            : isWarning
            ? 'text-amber-500'
            : 'text-zinc-400';

          const confidenceColor = isCritical
            ? 'text-white'
            : isWarning
            ? 'text-amber-300'
            : 'text-zinc-500';

          return (
            <div
              key={alert.id}
              className={`bg-zinc-900/90 border-2 ${cardBorder} p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all hover:bg-zinc-850`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className={`font-mono font-bold text-xs tracking-wider uppercase ${tagColor}`}>
                    {alert.line}
                  </p>
                  {alert.category && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/10 text-zinc-300 uppercase">
                      {alert.category}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  {alert.title}
                </h3>

                <p className="text-zinc-300 text-sm font-medium">
                  {alert.detail}
                </p>

                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 pt-1">
                  <span className="flex items-center gap-1 text-red-400 font-semibold italic">
                    <Clock className="w-3.5 h-3.5 inline" />
                    ETA: {alert.eta}
                  </span>
                  <span>•</span>
                  <span>TIME: {alert.timestamp}</span>
                </div>
              </div>

              <div className="text-left sm:text-right flex sm:flex-col justify-between items-end w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  AI CONFIDENCE
                </p>
                <p className={`text-3xl sm:text-4xl font-black italic tracking-tighter ${confidenceColor}`}>
                  {alert.confidence}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
