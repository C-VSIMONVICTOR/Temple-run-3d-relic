import React from 'react';
import { Volume2, VolumeX, Sparkles, Shield, Flame, Zap, Trophy, Play } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  onOpenShop: () => void;
  highScore: number;
  bestDistance: number;
  totalCoins: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenShop,
  highScore,
  bestDistance,
  totalCoins,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 select-none z-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center space-x-3 bg-black/60 border border-amber-800/40 px-4 py-2 rounded-xl text-amber-200">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-amber-500/80 font-semibold">High Score</span>
            <span className="font-mono-numbers font-bold text-sm md:text-base text-amber-300">
              {highScore.toLocaleString()} pts ({bestDistance}m)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Gold Bank */}
          <div className="flex items-center space-x-2 bg-black/60 border border-amber-800/40 px-3.5 py-2 rounded-xl">
            <div className="w-4 h-4 rounded-full bg-amber-400 border border-amber-200 shadow-sm shadow-amber-500" />
            <span className="font-mono-numbers font-bold text-amber-300 text-sm md:text-base">
              {totalCoins.toLocaleString()}
            </span>
          </div>

          {/* Mute Button */}
          <button
            onClick={() => {
              onToggleMute();
            }}
            aria-label="Toggle Audio"
            className="p-2.5 bg-black/60 border border-amber-800/40 hover:border-amber-600 rounded-xl text-amber-400 hover:text-amber-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Hero Center Lockup: Bespoke SVG Title */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-auto text-center px-4">
        {/* Decorative Aztec Sun/Relic Badge */}
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-950/70 border border-amber-600/50 rounded-full text-xs font-semibold tracking-widest uppercase text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Ancient Temple Escape 3D
        </div>

        {/* Bespoke SVG Title Lockup */}
        <div className="w-full max-w-lg md:max-w-xl">
          <svg viewBox="0 0 600 130" className="w-full h-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fff2a1" />
                <stop offset="35%" stopColor="#ffd700" />
                <stop offset="70%" stopColor="#d98216" />
                <stop offset="100%" stopColor="#7a3e00" />
              </linearGradient>
              <filter id="relicGlow">
                <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#f59e0b" floodOpacity="0.7" />
              </filter>
            </defs>
            <text
              x="50%"
              y="68"
              textAnchor="middle"
              className="font-cinzel"
              fill="url(#goldGrad)"
              fontSize="68"
              fontWeight="900"
              letterSpacing="7"
              filter="url(#relicGlow)"
              stroke="#2e1a05"
              strokeWidth="2"
            >
              TEMPLE RUN
            </text>
            <text
              x="50%"
              y="112"
              textAnchor="middle"
              className="font-cinzel"
              fill="#fed7aa"
              fontSize="20"
              fontWeight="700"
              letterSpacing="12"
              opacity="0.95"
            >
              RELIC ESCAPE
            </text>
          </svg>
        </div>

        <p className="max-w-md text-amber-200/80 text-sm md:text-base mt-2 mb-6">
          You stole the cursed golden idol! Outrun the demonic temple guardian across crumbling ruins and perilous chasms.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onStart}
            className="w-full sm:w-64 py-4 px-8 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold font-cinzel text-lg md:text-xl rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-amber-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-stone-950" />
            <span>PLAY NOW</span>
          </button>

          <button
            onClick={onOpenShop}
            className="w-full sm:w-auto py-3.5 px-6 bg-black/70 hover:bg-stone-900 border border-amber-700/60 hover:border-amber-500 text-amber-300 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-5 h-5 text-amber-400" />
            <span>Relic Vault</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hints Line */}
      <div className="w-full flex flex-col items-center gap-2 pointer-events-auto">
        <div className="bg-black/75 border border-amber-900/50 px-5 py-2.5 rounded-2xl text-xs md:text-sm text-stone-300 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">A</kbd>
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">D</kbd>
            <span className="text-stone-400">or</span>
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">→</kbd>
            <span>Lane / 90° Turn</span>
          </span>
          <span className="text-stone-600">·</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">W</kbd>
            <span className="text-stone-400">or</span>
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">Space</kbd>
            <span>Jump</span>
          </span>
          <span className="text-stone-600">·</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">S</kbd>
            <span className="text-stone-400">or</span>
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">↓</kbd>
            <span>Slide Under</span>
          </span>
          <span className="text-stone-600">·</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-600 rounded text-amber-300 font-mono text-xs">F</kbd>
            <span>Adrenaline Boost</span>
          </span>
        </div>
        <p className="text-xs text-stone-500 font-medium">Swipe gestures also supported on touch screens</p>
      </div>
    </div>
  );
};
