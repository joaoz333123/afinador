import React, { useRef } from 'react';
import { ViolaString, TuningAction } from '../types/tuner';
import { Mic, MicOff, Volume2, Radio, Upload } from 'lucide-react';

interface TunerMeterProps {
  selectedString: ViolaString;
  isMicActive: boolean;
  detectedFreq: number | null;
  cents: number;
  action: TuningAction;
  volume: number;
  noiseGateThreshold: number;
  isAutoMode: boolean;
  micError: string | null;
  onToggleMic: () => void;
  onPlayReference: () => void;
  onToggleMode: (auto: boolean) => void;
  onUploadAudio?: (file: File) => void;
}

export const TunerMeter: React.FC<TunerMeterProps> = ({
  selectedString,
  isMicActive,
  detectedFreq,
  cents,
  action,
  volume,
  noiseGateThreshold,
  isAutoMode,
  micError,
  onToggleMic,
  onPlayReference,
  onToggleMode,
  onUploadAudio,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Clamped cents (-50 to +50) mapped to rotation angle (-85deg to +85deg) matching visual scale
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const angle = (clampedCents / 50) * 85;

  // Sincroniza a posição do marcador do noise gate com a mesma escala do volume (rms / 0.06 * 100)%
  const minimumRms = (noiseGateThreshold * 0.02) + 0.002;
  const noiseGateMarkerPercent = Math.min(100, Math.max(0, (minimumRms / 0.06) * 100));

  let needleColor = '#eab308'; // yellow
  let actionText = 'Toque a corda...';
  let actionColor = 'text-neutral-400';
  let badgeBg = 'bg-neutral-800/80 border-neutral-700 text-neutral-300';

  if (isMicActive && detectedFreq) {
    if (action === 'in_tune') {
      needleColor = '#22c55e';
      actionText = '✓ Afinado!';
      actionColor = 'text-emerald-400 font-bold';
      badgeBg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
    } else if (action === 'too_low') {
      needleColor = '#3b82f6';
      actionText = '▲ Grave (Aperte a corda)';
      actionColor = 'text-blue-400 font-bold';
      badgeBg = 'bg-blue-500/20 border-blue-500/40 text-blue-300';
    } else if (action === 'too_high') {
      needleColor = '#ef4444';
      actionText = '▼ Agudo (Afrouxe a corda)';
      actionColor = 'text-red-400 font-bold';
      badgeBg = 'bg-red-500/20 border-red-500/40 text-red-300';
    }
  }

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center justify-between backdrop-blur relative overflow-hidden">
      
      {/* Top Bar: Mic Status and Auto/Manual Toggle */}
      <div className="w-full flex items-center justify-between text-xs pb-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isMicActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'
            }`}
          />
          <span className="font-medium text-neutral-400">
            {isMicActive ? 'Microfone Ativo (Ouvindo...)' : 'Microfone Pausado'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-black/40 rounded-xl p-0.5 border border-white/5">
          <button
            onClick={() => onToggleMode(true)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
              isAutoMode
                ? 'bg-amber-500 text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Auto
          </button>
          <button
            onClick={() => onToggleMode(false)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
              !isAutoMode
                ? 'bg-amber-500 text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-full max-w-[340px] aspect-[300/180] my-1">
        <svg viewBox="0 0 300 180" className="w-full h-full drop-shadow">
          <defs>
            <linearGradient id="tunerArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="42%" stopColor="#eab308" />
              <stop offset="48%" stopColor="#22c55e" />
              <stop offset="52%" stopColor="#22c55e" />
              <stop offset="58%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d="M 30 140 A 120 120 0 0 1 270 140"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Color Gradient Track */}
          <path
            d="M 30 140 A 120 120 0 0 1 270 140"
            fill="none"
            stroke="url(#tunerArcGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* In-Tune Sweet Spot Highlight */}
          <path
            d="M 144 20 A 120 120 0 0 1 156 20"
            fill="none"
            stroke="#22c55e"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Scale Labels */}
          <text x="32" y="156" fontSize="10" fill="#9ca3af" textAnchor="middle">-50</text>
          <text x="75" y="60" fontSize="10" fill="#9ca3af" textAnchor="middle">-25</text>
          <text x="150" y="12" fontSize="11" fontWeight="bold" fill="#22c55e" textAnchor="middle">0</text>
          <text x="225" y="60" fontSize="10" fill="#9ca3af" textAnchor="middle">+25</text>
          <text x="268" y="156" fontSize="10" fill="#9ca3af" textAnchor="middle">+50</text>

          {/* Needle Pin */}
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: '150px 140px',
              transition: 'transform 0.12s cubic-bezier(0.2, 0.8, 0.4, 1)'
            }}
          >
            <polygon points="148,140 152,140 150.8,24 149.2,24" fill={needleColor} />
            <circle cx="150" cy="23" r="3.5" fill={needleColor} />
            <circle cx="150" cy="140" r="10" fill="#1c1d22" stroke={needleColor} strokeWidth="3" />
            <circle cx="150" cy="140" r="4" fill="#ffffff" />
          </g>
        </svg>

        {/* Big Central Note Display */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pointer-events-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            {selectedString.label} • {selectedString.type.toUpperCase()}
          </span>

          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-5xl font-black tracking-tight text-white drop-shadow-md">
              {selectedString.note}
            </span>
            <span className="text-2xl font-bold text-amber-400">
              {selectedString.octave}
            </span>
          </div>

          <div className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold border ${badgeBg}`}>
            {isMicActive && detectedFreq ? `${cents >= 0 ? '+' : ''}${cents.toFixed(1)} cents` : 'Pronto'}
          </div>
        </div>
      </div>

      {/* Target vs Detected Readout */}
      <div className="w-full grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-white/10 text-center text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Alvo</span>
          <span className="font-mono font-bold text-white text-sm">
            {selectedString.frequency.toFixed(1)} Hz
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Detectado</span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {detectedFreq ? `${detectedFreq.toFixed(1)} Hz` : '-- Hz'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Status</span>
          <span className={`text-xs ${actionColor}`}>
            {actionText}
          </span>
        </div>
      </div>

      {/* Mic Error Banner */}
      {micError && (
        <div className="w-full mt-2 p-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs text-center">
          {micError}
        </div>
      )}

      {/* Action Buttons: Turn on Mic & Play Reference & Test Audio File */}
      <div className="w-full mt-4 flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          onClick={onToggleMic}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-sm shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 ${
            isMicActive
              ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-rose-900/30'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-600/20'
          }`}
        >
          {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{isMicActive ? 'Desligar Mic' : 'Ligar Mic'}</span>
        </button>

        <button
          onClick={onPlayReference}
          className="py-3 px-3 sm:px-4 rounded-2xl font-semibold text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-500/40 text-white transition flex items-center gap-1.5"
          title="Tocar som de referência para afinar de ouvido"
        >
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Tocar Tom</span>
        </button>

        {onUploadAudio && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,video/mp4,video/*,.mp4,.wav,.mp3,.m4a"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUploadAudio(file);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-3 sm:px-4 rounded-2xl font-semibold text-xs bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400 text-purple-200 transition flex items-center gap-1.5"
              title="Testar com arquivo de áudio gravado (.mp4, .wav, .mp3)"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Testar Áudio</span>
            </button>
          </>
        )}
      </div>

      {/* Noise Gate & Signal Level VU Bar */}
      <div className="w-full mt-3 flex items-center gap-2 text-[10px] text-neutral-400">
        <Radio className="w-3 h-3 text-neutral-500" />
        <span>Sinal:</span>
        <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="h-full bg-emerald-500 transition-all duration-75"
            style={{ width: `${volume}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
            style={{ left: `${noiseGateMarkerPercent}%` }}
            title="Corte do filtro de ruído"
          />
        </div>
        <span className="font-mono text-neutral-300 w-8 text-right">{volume}%</span>
      </div>

    </div>
  );
};
