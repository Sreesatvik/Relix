import React from 'react';
import { ArrowRight, BellOff, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface QuickActionsProps {
  onActionClick?: (actionName: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionClick,
  isMuted = false,
  onToggleMute,
}) => {
  return (
    <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-4">
      <button
        type="button"
        id="action-reroute"
        onClick={() => onActionClick?.('Reroute Inventory from Bay 7')}
        className="flex-1 bg-red-600 hover:bg-red-500 text-black p-4 text-left font-sans transition-transform active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        <p className="text-[10px] font-black uppercase text-black/80 tracking-wider">
          Immediate Mitigation Protocol
        </p>
        <p className="text-base sm:text-lg font-black leading-tight text-white uppercase tracking-tight flex items-center justify-between">
          <span>REROUTE INVENTORY FROM BAY 7</span>
          <ArrowRight className="w-5 h-5 ml-2 shrink-0 text-black" />
        </p>
      </button>

      <button
        type="button"
        id="action-suppress"
        onClick={() => onActionClick?.('Suppress Non-Critical Alerts')}
        className="flex-1 bg-white hover:bg-zinc-200 text-black p-4 text-left font-sans transition-transform active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
      >
        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-wider">
          Manual Floor Override
        </p>
        <p className="text-base sm:text-lg font-black leading-tight text-black uppercase tracking-tight flex items-center justify-between">
          <span>SUPPRESS ALL NON-CRITICAL</span>
          <BellOff className="w-5 h-5 ml-2 shrink-0 text-zinc-700" />
        </p>
      </button>

      {onToggleMute && (
        <button
          type="button"
          id="action-mute"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
          className="border border-white/20 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 flex items-center justify-center cursor-pointer transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-zinc-500" />
          ) : (
            <Volume2 className="w-5 h-5 text-emerald-400" />
          )}
        </button>
      )}
    </div>
  );
};
