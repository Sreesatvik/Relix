import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ShieldCheck, UserCheck, Wrench, Radio, Activity } from 'lucide-react';

interface RoleSwitcherProps {
  lastUpdated?: string;
  isConnected?: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  lastUpdated = '14:22:01 UTC',
  isConnected = true,
}) => {
  const location = useLocation();
  const searchParams = location.search; // Preserves ?incident=INC-XXX across tabs!

  return (
    <header className="bg-black border-b-2 border-white/20 px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Left: System Branding & Persistent Live Monitor Indicator */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-mono text-xs sm:text-sm font-black text-white tracking-widest uppercase">
              Relix // Operations Hub
            </span>
          </div>

          <span className="hidden sm:inline text-zinc-700">|</span>

          {/* Persistent Live Monitoring Status Indicator */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Monitor Agent: ACTIVE
            </span>
            <span className="text-zinc-600 font-mono text-[10px]">•</span>
            <span className="font-mono text-[11px] text-zinc-400">
              {lastUpdated}
            </span>
          </div>
        </div>

        {/* Right: Role Navigation Tabs with URL query preservation */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-zinc-900/90 p-1 border border-white/15 rounded-sm">
          <NavLink
            to={`/manager${searchParams}`}
            id="nav-manager"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-black tracking-tight uppercase transition-all ${
                isActive
                  ? 'bg-white text-black shadow-sm ring-2 ring-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Plant Manager</span>
          </NavLink>

          <NavLink
            to={`/supervisor${searchParams}`}
            id="nav-supervisor"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-black tracking-tight uppercase transition-all ${
                isActive
                  ? 'bg-white text-black shadow-sm ring-2 ring-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`
            }
          >
            <UserCheck className="w-4 h-4" />
            <span>Line Supervisor</span>
          </NavLink>

          <NavLink
            to={`/maintenance${searchParams}`}
            id="nav-maintenance"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-black tracking-tight uppercase transition-all ${
                isActive
                  ? 'bg-white text-black shadow-sm ring-2 ring-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`
            }
          >
            <Wrench className="w-4 h-4" />
            <span>Maintenance</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
