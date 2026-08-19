import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { RiskLevel } from '../types';

interface AggregateRiskCardProps {
  score: number;
  threshold?: number;
  level?: RiskLevel;
  subtitle?: string;
}

export const AggregateRiskCard: React.FC<AggregateRiskCardProps> = ({
  score,
  threshold = 70,
  level = score >= 75 ? 'CRITICAL' : score >= 45 ? 'WARNING' : 'NOMINAL',
  subtitle = score >= 75
    ? 'Critical Threshold Exceeded'
    : score >= 45
    ? 'Elevated Disruption Risk'
    : 'All Systems Operating Within Tolerance',
}) => {
  const isCritical = level === 'CRITICAL' || score >= 75;
  const isWarning = level === 'WARNING' || (score >= 45 && score < 75);

  const containerClasses = isCritical
    ? 'bg-red-950/30 border-l-8 border-red-600 text-red-500'
    : isWarning
    ? 'bg-amber-950/30 border-l-8 border-amber-500 text-amber-500'
    : 'bg-emerald-950/30 border-l-8 border-emerald-500 text-emerald-500';

  const badgeColor = isCritical
    ? 'text-red-500'
    : isWarning
    ? 'text-amber-500'
    : 'text-emerald-400';

  return (
    <div className={`${containerClasses} p-6 transition-all duration-300`}>
      <div className="flex justify-between items-start">
        <h2 className={`text-xs font-mono uppercase font-bold tracking-wider mb-2 ${badgeColor}`}>
          Aggregate Plant Disruption Risk
        </h2>
        {isCritical && <AlertOctagon className="w-6 h-6 text-red-500 animate-pulse" />}
        {isWarning && <AlertTriangle className="w-6 h-6 text-amber-500" />}
        {!isCritical && !isWarning && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
      </div>

      <div className="flex items-baseline gap-2 text-white my-2">
        <span className="text-7xl sm:text-8xl md:text-[110px] xl:text-[120px] font-black leading-none tracking-tighter">
          {score}
        </span>
        <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-300">%</span>
      </div>

      <p className={`font-bold text-lg sm:text-xl uppercase mt-2 italic tracking-tight ${badgeColor}`}>
        {subtitle}
      </p>

      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs font-mono text-zinc-400">
        <span>TRIGGER THRESHOLD: {threshold}%</span>
        <span>STATUS: {isCritical ? 'ACTION REQUIRED' : isWarning ? 'MONITOR CLOSELY' : 'OPTIMAL'}</span>
      </div>
    </div>
  );
};
