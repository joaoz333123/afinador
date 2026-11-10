import React from 'react';
import { ViolaString } from '../types/tuner';
import { Volume2 } from 'lucide-react';

interface StringPairListProps {
  strings: ViolaString[];
  selectedStringId: number;
  onSelectString: (id: number) => void;
  onPlayStringTone: (string: ViolaString) => void;
}

export const StringPairList: React.FC<StringPairListProps> = ({
  strings,
  selectedStringId,
  onSelectString,
  onPlayStringTone,
}) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-4 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
          5 Pares de Cordas (10 Cordas)
        </h3>
        <span className="text-[10px] text-neutral-400">Toque 🔊 para ouvir</span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
        {strings.map((str) => {
          const isSelected = selectedStringId === str.id;

          let badgeClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
          if (str.type === 'bordão') {
            badgeClass = 'bg-purple-950/60 text-purple-300 border-purple-500/30';
          } else if (str.type === 'requinta') {
            badgeClass = 'bg-sky-950/60 text-sky-300 border-sky-500/30';
          }

          return (
            <div
              key={str.id}
              onClick={() => onSelectString(str.id)}
              className={`flex items-center justify-between p-2 rounded-2xl text-xs border transition cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/80 shadow-md shadow-amber-950/20'
                  : 'bg-black/30 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    isSelected ? 'bg-amber-500 text-black shadow' : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {str.pair}
                </span>

                <div>
                  <div className="font-bold flex items-center gap-1.5 text-white">
                    <span>{str.label}</span>
                    <span className="font-mono text-amber-300">
                      {str.note}{str.octave}
                    </span>
                    <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded border ${badgeClass}`}>
                      {str.type}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {str.frequency.toFixed(1)} Hz
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayStringTone(str);
                }}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition active:scale-95 border border-white/5"
                title={`Ouvir tom de ${str.label}`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
