import React from 'react';
import { TuningPreset } from '../types/tuner';
import { Settings, Music } from 'lucide-react';

interface HeaderProps {
  presets: Record<string, TuningPreset>;
  currentTuningKey: string;
  a4BaseFreq: number;
  onTuningChange: (key: string) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  currentTuningKey,
  a4BaseFreq,
  onTuningChange,
  onOpenSettings,
}) => {
  return (
    <header className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl shadow-inner">
          <Music className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
              Afinador de Viola Caipira
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
              10 Cordas
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            {presets[currentTuningKey]?.name} • {presets[currentTuningKey]?.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-neutral-900 border border-neutral-700/60 rounded-xl px-3 py-1.5 text-xs shadow-sm">
          <label htmlFor="tuningSelect" className="text-neutral-400 mr-2 font-medium">
            Afinação:
          </label>
          <select
            id="tuningSelect"
            value={currentTuningKey}
            onChange={(e) => onTuningChange(e.target.value)}
            className="bg-transparent text-amber-300 font-semibold outline-none cursor-pointer"
          >
            {Object.values(presets).map((p) => (
              <option key={p.key} value={p.key} className="bg-neutral-900 text-white">
                {p.name} ({p.rootNote})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 px-3 rounded-xl bg-neutral-900 border border-neutral-700/60 hover:border-amber-500/50 hover:bg-neutral-800 text-xs flex items-center gap-1.5 transition text-neutral-300 hover:text-white"
          title="Configurações e Calibração A4"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono font-medium">{a4BaseFreq}Hz</span>
        </button>
      </div>
    </header>
  );
};
