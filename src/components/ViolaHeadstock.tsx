import React from 'react';
import { ViolaString } from '../types/tuner';

interface ViolaHeadstockProps {
  strings: ViolaString[];
  selectedStringId: number;
  onSelectString: (id: number) => void;
}

export const ViolaHeadstock: React.FC<ViolaHeadstockProps> = ({
  strings,
  selectedStringId,
  onSelectString,
}) => {
  // Mapping of peg index to string id
  // Left side pegs (from top to bottom): 3º Bordão (5), 4º Requinta (6), 4º Bordão (7), 5º Requinta (8), 5º Bordão (9)
  // Right side pegs (from top to bottom): 3º Requinta (4), 2º Par A (3), 2º Par B (2), 1º Par A (1), 1º Par B (0)

  const leftPegs = [
    { pegId: 5, label: '3B' },
    { pegId: 6, label: '4R' },
    { pegId: 7, label: '4B' },
    { pegId: 8, label: '5R' },
    { pegId: 9, label: '5B' },
  ];

  const rightPegs = [
    { pegId: 4, label: '3R' },
    { pegId: 3, label: '2º' },
    { pegId: 2, label: '2º' },
    { pegId: 1, label: '1º' },
    { pegId: 0, label: '1º' },
  ];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-4 shadow-xl flex flex-col items-center backdrop-blur">
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-xs">
        <span className="font-bold text-amber-300">Mão da Viola (Cravelhal)</span>
        <span className="text-[11px] text-neutral-400">Clique nas cravelhas para afinar</span>
      </div>

      <div className="w-full max-w-[270px] aspect-[260/360] relative my-1">
        <svg viewBox="0 0 260 360" className="w-full h-full drop-shadow-2xl select-none">
          <defs>
            <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a2511" />
              <stop offset="35%" stopColor="#733e1d" />
              <stop offset="70%" stopColor="#592f15" />
              <stop offset="100%" stopColor="#361708" />
            </linearGradient>

            <linearGradient id="pegActive" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>

            <linearGradient id="pegIdle" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#8c6d23" />
            </linearGradient>

            <linearGradient id="nutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e5e5e5" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d4d4d4" />
            </linearGradient>
          </defs>

          {/* Viola Headstock Body */}
          <path
            d="M 60 350 L 55 310 C 50 250, 35 150, 45 80 C 50 45, 90 20, 130 18 C 170 20, 210 45, 215 80 C 225 150, 210 250, 205 310 L 200 350 Z"
            fill="url(#woodGradient)"
            stroke="#271207"
            strokeWidth="3"
          />

          {/* Decorative Floral Inlay */}
          <path d="M 130 40 Q 140 65 130 90 Q 120 65 130 40 Z" fill="#d4af37" opacity="0.6" />
          <circle cx="130" cy="115" r="8" fill="#271207" stroke="#d4af37" strokeWidth="1.5" />
          <circle cx="130" cy="115" r="4" fill="#d4af37" />

          {/* Two Mechanical Slots (Janelas) */}
          <rect x="75" y="85" width="28" height="190" rx="12" fill="#170a04" stroke="#361708" strokeWidth="2" />
          <rect x="157" y="85" width="28" height="190" rx="12" fill="#170a04" stroke="#361708" strokeWidth="2" />

          {/* Brass Rollers */}
          {[105, 140, 175, 210, 245].map((y, idx) => (
            <React.Fragment key={idx}>
              <circle cx="89" cy={y} r="5" fill="#c59b27" />
              <circle cx="171" cy={y} r="5" fill="#c59b27" />
            </React.Fragment>
          ))}

          {/* Bone Nut */}
          <rect x="52" y="315" width="156" height="10" rx="2" fill="url(#nutGrad)" stroke="#888" strokeWidth="0.8" />

          {/* Strings with dynamic active glow */}
          {/* Pair 5 */}
          <line
            x1="89" y1="245" x2="68" y2="360"
            stroke={selectedStringId === 9 ? '#22c55e' : '#ccc'}
            strokeWidth={selectedStringId === 9 ? 3.0 : 2.2}
            className={selectedStringId === 9 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(9)}
          />
          <line
            x1="89" y1="210" x2="74" y2="360"
            stroke={selectedStringId === 8 ? '#22c55e' : '#bbb'}
            strokeWidth={selectedStringId === 8 ? 2.4 : 1.2}
            className={selectedStringId === 8 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(8)}
          />

          {/* Pair 4 */}
          <line
            x1="89" y1="175" x2="90" y2="360"
            stroke={selectedStringId === 7 ? '#22c55e' : '#ccc'}
            strokeWidth={selectedStringId === 7 ? 2.8 : 2.0}
            className={selectedStringId === 7 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(7)}
          />
          <line
            x1="89" y1="140" x2="96" y2="360"
            stroke={selectedStringId === 6 ? '#22c55e' : '#bbb'}
            strokeWidth={selectedStringId === 6 ? 2.2 : 1.0}
            className={selectedStringId === 6 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(6)}
          />

          {/* Pair 3 */}
          <line
            x1="89" y1="105" x2="114" y2="360"
            stroke={selectedStringId === 5 ? '#22c55e' : '#ccc'}
            strokeWidth={selectedStringId === 5 ? 2.6 : 1.8}
            className={selectedStringId === 5 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(5)}
          />
          <line
            x1="171" y1="105" x2="120" y2="360"
            stroke={selectedStringId === 4 ? '#22c55e' : '#bbb'}
            strokeWidth={selectedStringId === 4 ? 2.2 : 0.9}
            className={selectedStringId === 4 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(4)}
          />

          {/* Pair 2 */}
          <line
            x1="171" y1="140" x2="140" y2="360"
            stroke={selectedStringId === 3 ? '#22c55e' : '#bbb'}
            strokeWidth={selectedStringId === 3 ? 2.4 : 1.2}
            className={selectedStringId === 3 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(3)}
          />
          <line
            x1="171" y1="175" x2="146" y2="360"
            stroke={selectedStringId === 2 ? '#22c55e' : '#bbb'}
            strokeWidth={selectedStringId === 2 ? 2.4 : 1.2}
            className={selectedStringId === 2 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(2)}
          />

          {/* Pair 1 */}
          <line
            x1="171" y1="210" x2="168" y2="360"
            stroke={selectedStringId === 1 ? '#22c55e' : '#bbb'}
            strokeWidth={selectedStringId === 1 ? 2.2 : 1.0}
            className={selectedStringId === 1 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(1)}
          />
          <line
            x1="171" y1="245" x2="174" y2="360"
            stroke={selectedStringId === 0 ? '#22c55e' : '#bbb'}
            strokeWidth={selectedStringId === 0 ? 2.2 : 1.0}
            className={selectedStringId === 0 ? 'string-glow cursor-pointer' : 'cursor-pointer'}
            onClick={() => onSelectString(0)}
          />

          {/* LEFT PEGS */}
          {leftPegs.map((peg, index) => {
            const y = 98 + index * 35;
            const isSelected = selectedStringId === peg.pegId;
            return (
              <g
                key={peg.pegId}
                className="cursor-pointer"
                onClick={() => onSelectString(peg.pegId)}
              >
                <rect
                  x="12"
                  y={y}
                  width="36"
                  height="14"
                  rx="4"
                  fill={isSelected ? 'url(#pegActive)' : 'url(#pegIdle)'}
                  stroke={isSelected ? '#22c55e' : '#5c4314'}
                  strokeWidth={isSelected ? '2' : '1'}
                />
                <text
                  x="30"
                  y={y + 11}
                  fontSize="9"
                  fontWeight="bold"
                  fill={isSelected ? '#052e16' : '#222'}
                  textAnchor="middle"
                >
                  {peg.label}
                </text>
              </g>
            );
          })}

          {/* RIGHT PEGS */}
          {rightPegs.map((peg, index) => {
            const y = 98 + index * 35;
            const isSelected = selectedStringId === peg.pegId;
            return (
              <g
                key={peg.pegId}
                className="cursor-pointer"
                onClick={() => onSelectString(peg.pegId)}
              >
                <rect
                  x="212"
                  y={y}
                  width="36"
                  height="14"
                  rx="4"
                  fill={isSelected ? 'url(#pegActive)' : 'url(#pegIdle)'}
                  stroke={isSelected ? '#22c55e' : '#5c4314'}
                  strokeWidth={isSelected ? '2' : '1'}
                />
                <text
                  x="230"
                  y={y + 11}
                  fontSize="9"
                  fontWeight="bold"
                  fill={isSelected ? '#052e16' : '#222'}
                  textAnchor="middle"
                >
                  {peg.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="w-full flex items-center justify-around text-[10px] text-neutral-400 mt-2 px-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Selecionada
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Cravelhas
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neutral-400"></span> Cordas
        </span>
      </div>
    </div>
  );
};
