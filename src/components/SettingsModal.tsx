import React from 'react';
import { Settings, X, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  a4BaseFreq: number;
  noiseGateThreshold: number;
  onClose: () => void;
  onA4Change: (freq: number) => void;
  onNoiseGateChange: (threshold: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  a4BaseFreq,
  noiseGateThreshold,
  onClose,
  onA4Change,
  onNoiseGateChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Configurações e Calibração
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* A4 Reference Calibration */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-white">
              Calibração A4 (Lá padrão)
            </label>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {a4BaseFreq} Hz
            </span>
          </div>

          <input
            type="range"
            min="430"
            max="450"
            step="1"
            value={a4BaseFreq}
            onChange={(e) => onA4Change(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />

          <div className="flex justify-between items-center text-[11px] text-neutral-400">
            <span>430 Hz</span>
            <button
              onClick={() => onA4Change(440)}
              className="flex items-center gap-1 text-amber-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar 440 Hz
            </button>
            <span>450 Hz</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            O padrão internacional é 440 Hz. Alguns grupos e orquestras utilizam 442 Hz ou 432 Hz.
          </p>
        </div>

        {/* Noise Gate Sensitivity */}
        <div className="space-y-2 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-white">
              Filtro de Ruído / Noise Gate
            </label>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {Math.round(noiseGateThreshold * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="5"
            max="40"
            step="1"
            value={Math.round(noiseGateThreshold * 100)}
            onChange={(e) => onNoiseGateChange(Number(e.target.value) / 100)}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Sensível (5%)</span>
            <span>Ambiente com ruído (40%)</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Aumente se o afinador estiver captando sons ou vozes do ambiente quando a viola estiver em silêncio.
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          Concluir
        </button>
      </div>
    </div>
  );
};
