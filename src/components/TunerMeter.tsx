import React, { useRef, useMemo } from 'react';
import { ViolaString, TuningPreset, TuningAction } from '../types/tuner';
import { Mic, MicOff, Volume2, Radio, Upload, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';

interface TunerMeterProps {
  selectedString: ViolaString;
  currentPreset?: TuningPreset;
  isMicActive: boolean;
  detectedFreq: number | null;
  cents: number;
  dialAngle: number;
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

// 12 chromatic notes arranged identically to Google Guitar Tuner (0° = C at 12 o'clock, clockwise)
const CHROMATIC_NOTES = [
  { name: 'C', angle: 0 },
  { name: 'C#', angle: 30 },
  { name: 'D', angle: 60 },
  { name: 'D#', angle: 90 },
  { name: 'E', angle: 120 },
  { name: 'F', angle: 150 },
  { name: 'F#', angle: 180 },
  { name: 'G', angle: 210 },
  { name: 'G#', angle: 240 },
  { name: 'A', angle: 270 },
  { name: 'A#', angle: 300 },
  { name: 'B', angle: 330 },
];

export const TunerMeter: React.FC<TunerMeterProps> = ({
  selectedString,
  currentPreset,
  isMicActive,
  detectedFreq,
  cents,
  dialAngle,
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

  // Notes belonging to the active Viola tuning preset (e.g. Cebolão em Mi: E, B, G#)
  const presetNotes = useMemo(() => {
    if (!currentPreset) return new Set<string>();
    return new Set(currentPreset.strings.map((s) => s.note));
  }, [currentPreset]);

  // Status visual cues
  let needleColor = '#eab308'; // warm yellow default
  let actionText = 'Toque a corda...';
  let actionColor = 'text-neutral-400';
  let badgeBg = 'bg-neutral-800/80 border-neutral-700 text-neutral-300';
  let ActionIcon = Radio;

  if (isMicActive && detectedFreq) {
    if (action === 'in_tune') {
      needleColor = '#22c55e';
      actionText = 'Afinado!';
      actionColor = 'text-emerald-400 font-bold';
      badgeBg = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
      ActionIcon = CheckCircle2;
    } else if (action === 'too_low') {
      needleColor = '#38bdf8';
      actionText = 'Grave (Aperte a corda)';
      actionColor = 'text-sky-400 font-bold';
      badgeBg = 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.25)]';
      ActionIcon = ArrowUp;
    } else if (action === 'too_high') {
      needleColor = '#f43f5e';
      actionText = 'Agudo (Afrouxe a corda)';
      actionColor = 'text-rose-400 font-bold';
      badgeBg = 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]';
      ActionIcon = ArrowDown;
    }
  }

  // Noise gate position on VU meter
  const minimumRms = noiseGateThreshold * 0.02 + 0.002;
  const noiseGateMarkerPercent = Math.min(100, Math.max(0, (minimumRms / 0.06) * 100));

  // Fine cents linear indicator clamped between -50 and +50
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const centsPercent = ((clampedCents + 50) / 100) * 100;

  // Geometry for 320x320 SVG dial
  const cx = 160;
  const cy = 160;
  const outerRadius = 142;
  const innerRadius = 104;
  const textRadius = 124;

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center justify-between backdrop-blur relative overflow-hidden">
      
      {/* Top Bar: Mic Status and Auto/Manual Toggle */}
      <div className="w-full flex items-center justify-between text-xs pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isMicActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'
            }`}
          />
          <span className="font-medium text-neutral-400 text-[11px] sm:text-xs">
            {isMicActive ? 'Microfone Ativo (Ouvindo...)' : 'Microfone Pausado'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-black/50 rounded-xl p-0.5 border border-white/5">
          <button
            onClick={() => onToggleMode(true)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
              isAutoMode
                ? 'bg-amber-500 text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Detecção automática de corda por impacto sonoro (Google Onset Gated)"
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
            title="Fixar na corda selecionada"
          >
            Manual
          </button>
        </div>
      </div>

      {/* Google-Inspired 12-Note Chromatic Clock Dial (360° Relógio Cromático) */}
      <div className="relative w-full max-w-[340px] aspect-square my-2 flex items-center justify-center">
        <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl select-none">
          <defs>
            {/* Dial Background Radial Gradient */}
            <radialGradient id="clockDialGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="68%" stopColor="#121215" />
              <stop offset="90%" stopColor="#222228" />
              <stop offset="100%" stopColor="#2e2e38" />
            </radialGradient>

            {/* Inner Hub Shadow */}
            <radialGradient id="innerHubGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#24242c" />
              <stop offset="85%" stopColor="#131317" />
              <stop offset="100%" stopColor="#0b0b0e" />
            </radialGradient>

            {/* Needle Glow */}
            <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Bezel */}
          <circle
            cx={cx}
            cy={cy}
            r={outerRadius + 8}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3"
          />

          {/* Outer Ring Background */}
          <circle
            cx={cx}
            cy={cy}
            r={outerRadius}
            fill="url(#clockDialGrad)"
            stroke="#27272a"
            strokeWidth="1.5"
          />

          {/* 360° Ticks: 12 Major Semitones + Sub-ticks */}
          {Array.from({ length: 60 }).map((_, index) => {
            const angleDeg = index * 6;
            const isMajor = angleDeg % 30 === 0;
            const isSemiMajor = angleDeg % 15 === 0;
            const rStart = isMajor ? outerRadius - 12 : isSemiMajor ? outerRadius - 8 : outerRadius - 5;
            const rEnd = outerRadius - 1;
            const rad = ((angleDeg - 90) * Math.PI) / 180;
            const x1 = cx + rStart * Math.cos(rad);
            const y1 = cy + rStart * Math.sin(rad);
            const x2 = cx + rEnd * Math.cos(rad);
            const y2 = cy + rEnd * Math.sin(rad);

            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}
                strokeWidth={isMajor ? 2 : 1}
              />
            );
          })}

          {/* 12 Note Labels around the perimeter */}
          {CHROMATIC_NOTES.map((item) => {
            const rad = ((item.angle - 90) * Math.PI) / 180;
            const x = cx + textRadius * Math.cos(rad);
            const y = cy + textRadius * Math.sin(rad);
            const isTuningNote = presetNotes.has(item.name);
            const isCurrentTarget = selectedString.note === item.name;

            return (
              <g key={item.name}>
                {/* Highlight ring for active viola tuning chord notes */}
                {isTuningNote && (
                  <circle
                    cx={x}
                    cy={y}
                    r={14}
                    fill={isCurrentTarget ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.08)'}
                    stroke={isCurrentTarget ? '#f59e0b' : 'rgba(245,158,11,0.4)'}
                    strokeWidth={isCurrentTarget ? 1.5 : 1}
                  />
                )}

                <text
                  x={x}
                  y={y + 4.5}
                  textAnchor="middle"
                  fontSize={isCurrentTarget ? '13' : '11'}
                  fontWeight={isCurrentTarget ? '900' : isTuningNote ? '700' : '500'}
                  fill={
                    isCurrentTarget
                      ? '#fbbf24'
                      : isTuningNote
                      ? '#fef08a'
                      : 'rgba(255,255,255,0.35)'
                  }
                  className="font-mono transition-colors"
                >
                  {item.name}
                </text>
              </g>
            );
          })}

          {/* Inner Circular Hub Border */}
          <circle
            cx={cx}
            cy={cy}
            r={innerRadius}
            fill="url(#innerHubGrad)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />

          {/* Google Smooth Damping Pointer Needle */}
          <g
            style={{
              transform: `rotate(${dialAngle}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'transform 0.04s linear',
            }}
          >
            {/* Needle Trail Beam */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - outerRadius + 8}
              stroke={needleColor}
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#needleGlow)"
              opacity="0.9"
            />

            {/* Needle Arrow Tip */}
            <polygon
              points={`${cx - 5},${cy - outerRadius + 16} ${cx + 5},${cy - outerRadius + 16} ${cx},${cy - outerRadius + 5}`}
              fill={needleColor}
              filter="url(#needleGlow)"
            />

            {/* Counterweight */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy + 22}
              stroke={needleColor}
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.5"
            />
          </g>

          {/* Center Hub Core Pivot */}
          <circle
            cx={cx}
            cy={cy}
            r="16"
            fill="#121215"
            stroke={needleColor}
            strokeWidth="3"
            filter="url(#needleGlow)"
          />
          <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
        </svg>

        {/* Central Display Floating Inside the Hub */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          
          {/* Target String Category */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-0.5">
            {selectedString.label} • {selectedString.type}
          </span>

          {/* Huge Note Letter and Octave */}
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {selectedString.note}
            </span>
            <span className="text-2xl font-bold text-amber-400">
              {selectedString.octave}
            </span>
          </div>

          {/* Cents & Status Pill */}
          <div className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border transition-all ${badgeBg}`}>
            {isMicActive && detectedFreq ? `${cents >= 0 ? '+' : ''}${cents.toFixed(1)} cents` : 'Pronto'}
          </div>

          {/* Directional Action */}
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            <ActionIcon className={`w-3.5 h-3.5 ${actionColor}`} />
            <span className={actionColor}>{actionText}</span>
          </div>
        </div>
      </div>

      {/* Fine-Tuning Cents Deviation Bar (-50 to +50 cents) */}
      <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-3 my-1">
        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1.5 px-1">
          <span className="text-sky-400 font-semibold">◀ -50 cents (Grave)</span>
          <span className="text-emerald-400 font-bold">0 (Afinado)</span>
          <span className="text-rose-400 font-semibold">+50 cents (Agudo) ▶</span>
        </div>

        {/* Track */}
        <div className="w-full h-2.5 bg-neutral-950 rounded-full relative overflow-hidden border border-white/10">
          {/* Sweet Spot +/- 3.5 cents */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-500/60"
            style={{ left: '46.5%', width: '7%' }}
            title="Margem exata de afinação (+/- 3.5 cents)"
          />
          {/* Center line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-emerald-400/80 z-10" />

          {/* Indicator Dot */}
          <div
            className="absolute top-0 bottom-0 w-3 rounded-full -translate-x-1/2 transition-all duration-75 shadow-md"
            style={{
              left: `${centsPercent}%`,
              backgroundColor: needleColor,
              boxShadow: `0 0 10px ${needleColor}`,
            }}
          />
        </div>
      </div>

      {/* Target vs Detected Frequency Readout */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Alvo</span>
          <span className="font-mono font-bold text-white text-sm">
            {selectedString.frequency.toFixed(1)} Hz
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Detectado</span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {detectedFreq ? `${detectedFreq.toFixed(1)} Hz` : '-- Hz'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Afinação</span>
          <span className="text-[11px] font-semibold text-neutral-300 truncate">
            {currentPreset?.name.split(' (')[0] || 'Viola Caipira'}
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
      <div className="w-full mt-3 flex items-center gap-2 sm:gap-3 flex-wrap">
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
