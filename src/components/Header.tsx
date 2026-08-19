import React from 'react';
import { Activity, ShieldAlert, Wifi } from 'lucide-react';

interface HeaderProps {
  systemTitle?: string;
  subTitle?: string;
  lastSync?: string;
  isOnline?: boolean;
  statusText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  systemTitle = 'System: Vanguard-AI // Early Warning',
  subTitle = 'MANUFACTURING DISRUPTION FEED',
  lastSync = 'LIVE SYNC',
  isOnline = true,
  statusText = '[ SYSTEM OPERATIONAL ]',
}) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between sm:items-end border-b-2 border-white/20 pb-4 mb-6 md:mb-8 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 className="text-xs sm:text-sm font-mono tracking-widest text-zinc-400 uppercase">
            {systemTitle}
          </h1>
        </div>
        <p className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none text-white uppercase">
          {subTitle}
        </p>
      </div>

      <div className="text-left sm:text-right flex sm:flex-col justify-between items-start sm:items-end gap-1">
        <p className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-zinc-400 inline" />
          <span>LAST SYNC: {lastSync}</span>
        </p>
        <p
          className={`text-lg sm:text-xl font-black tracking-tight ${
            isOnline ? 'text-emerald-400' : 'text-red-500'
          }`}
        >
          {statusText}
        </p>
      </div>
    </header>
  );
};
