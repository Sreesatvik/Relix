import React from 'react';
import { Filter, Layers } from 'lucide-react';

export type DomainFilterOption = 'All' | 'Quality' | 'Materials' | 'Workforce' | 'Machine' | 'Logistics';

interface DomainFilterProps {
  selectedDomain: DomainFilterOption;
  onSelectDomain: (domain: DomainFilterOption) => void;
  domainCounts?: Record<string, number>;
}

export const DOMAIN_OPTIONS: DomainFilterOption[] = [
  'All',
  'Quality',
  'Materials',
  'Workforce',
  'Machine',
  'Logistics',
];

export const DomainFilter: React.FC<DomainFilterProps> = ({
  selectedDomain,
  onSelectDomain,
  domainCounts = {},
}) => {
  return (
    <div className="bg-zinc-950 border border-white/15 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
        <Filter className="w-3.5 h-3.5 text-zinc-400" />
        <span>Domain Filter:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {DOMAIN_OPTIONS.map((domain) => {
          const isSelected = selectedDomain === domain;
          const count = domainCounts[domain.toLowerCase()];

          return (
            <button
              key={domain}
              type="button"
              id={`domain-filter-${domain.toLowerCase()}`}
              onClick={() => onSelectDomain(domain)}
              className={`px-3 py-1 text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.3)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
              }`}
            >
              <span>{domain}</span>
              {typeof count === 'number' && domain !== 'All' && (
                <span
                  className={`ml-1.5 text-[10px] px-1 rounded-xs ${
                    isSelected ? 'bg-black/40 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
