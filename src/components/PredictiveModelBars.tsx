import React from 'react';
import { PredictionBar } from '../types';

interface PredictiveModelBarsProps {
  bars?: PredictionBar[];
  version?: string;
}

const defaultBars: PredictionBar[] = [
  { timeLabel: '-60m', riskScore: 35 },
  { timeLabel: '-50m', riskScore: 42 },
  { timeLabel: '-40m', riskScore: 38 },
  { timeLabel: '-30m', riskScore: 55 },
  { timeLabel: '-20m', riskScore: 82, isPeak: true },
  { timeLabel: '-10m', riskScore: 94, isPeak: true },
  { timeLabel: 'NOW', riskScore: 84, isPeak: true },
  { timeLabel: '+10m', riskScore: 78 },
  { timeLabel: '+20m', riskScore: 65 },
  { timeLabel: '+30m', riskScore: 48 },
  { timeLabel: '+45m', riskScore: 30 },
];

export const PredictiveModelBars: React.FC<PredictiveModelBarsProps> = ({
  bars = defaultBars,
  version = 'v4.2 // MULTI-SENSOR INFERENCE',
}) => {
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          PREDICTIVE RISK TIMELINE ({version})
        </h3>
        <span className="text-[10px] font-mono text-zinc-500">60-MIN HORIZON</span>
      </div>

      <div className="h-24 w-full flex items-end gap-1.5 sm:gap-2 px-1">
        {bars.map((bar, idx) => {
          const isCritical = bar.riskScore >= 75;
          const isWarning = bar.riskScore >= 45 && bar.riskScore < 75;

          const barBg = isCritical
            ? 'bg-red-600 hover:bg-red-500'
            : isWarning
            ? 'bg-amber-500 hover:bg-amber-400'
            : 'bg-zinc-800 hover:bg-zinc-700';

          return (
            <div key={idx} className="group relative flex-1 flex flex-col items-center h-full justify-end">
              {/* Tooltip on hover */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 px-1.5 py-0.5 text-[10px] font-mono text-white pointer-events-none whitespace-nowrap z-10">
                {bar.timeLabel}: {bar.riskScore}%
              </div>

              <div
                className={`w-full ${barBg} transition-all duration-300 rounded-t-xs`}
                style={{ height: `${Math.max(bar.riskScore, 10)}%` }}
              />
              <span className="text-[9px] font-mono text-zinc-500 mt-1 truncate">
                {bar.timeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
