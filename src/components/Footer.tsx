import React from 'react';

interface FooterProps {
  engineName?: string;
  terminalId?: string;
  mode?: string;
}

export const Footer: React.FC<FooterProps> = ({
  engineName = 'NeuralCore-9 // Real-time Inference Active',
  terminalId = 'JURY-DEMO-01',
  mode = 'Projector Mode: Optimized High Contrast',
}) => {
  return (
    <footer className="mt-8 pt-4 border-t border-white/15 flex flex-col sm:flex-row justify-between items-center font-mono text-[10px] sm:text-[11px] text-zinc-400 uppercase tracking-widest gap-2">
      <span className="text-zinc-300">AI Engine: {engineName}</span>
      <span className="text-emerald-400 font-semibold">{mode}</span>
      <span className="text-zinc-400">Frontend Terminal ID: {terminalId}</span>
    </footer>
  );
};
