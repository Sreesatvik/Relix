import React from 'react';
import { PlantMetric } from '../types';

interface PlantMetricsProps {
  metrics: PlantMetric[];
}

export const PlantMetrics: React.FC<PlantMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="border border-white/15 bg-zinc-900/40 p-4 transition-colors hover:border-white/30"
        >
          <div className="flex justify-between items-center mb-1">
            <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider truncate">
              {metric.label}
            </p>
            {metric.change && (
              <span
                className={`text-[10px] font-mono font-bold ${
                  metric.change.startsWith('+')
                    ? 'text-emerald-400'
                    : metric.change.startsWith('-')
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }`}
              >
                {metric.change}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {metric.value}
            </p>
            {metric.unit && (
              <span className="text-xs font-mono text-zinc-400 font-semibold">{metric.unit}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
