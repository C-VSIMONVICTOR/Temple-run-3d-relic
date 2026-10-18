import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Sparkles, Trophy, ShoppingBag, Heart } from 'lucide-react';
import type { GameStats } from '../game/engine';

interface GameOverModalProps {
  stats: GameStats;
  highScore: number;
  bestDistance: number;
  totalCoins: number;
  onRestart: () => void;
  onRevive: () => void;
  onExitTitle: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  bestDistance,
  totalCoins,
  onRestart,
  onRevive,
  onExitTitle,
  onOpenShop,
}) => {
  const isNewHighScore = stats.score > highScore;
  const isNewBestDistance = stats.distance > bestDistance;
  const canRevive = totalCoins >= 250;
  const [hasRevived, setHasRevived] = useState(false);

  useEffect(() => {
    if (isNewHighScore || isNewBestDistance) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#f59e0b', '#10b981', '#ffffff'],
        });
      } catch {
        // Ignore
      }
    }
  }, [isNewHighScore, isNewBestDistance]);

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border border-amber-800/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Skull / Relic header */}
        <div className="w-16 h-16 rounded-2xl bg-amber-950/70 border border-amber-600/60 flex items-center justify-center mb-3 text-2xl shadow-inner">
          💀
        </div>

        <h2 className="font-cinzel text-2xl md:text-3xl font-extrabold text-amber-400 tracking-wider mb-1">
          TEMPLE CLAIMED YOU
        </h2>

        {isNewHighScore && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/80 rounded-full text-xs font-bold text-amber-300 uppercase tracking-widest my-2 box-gold-glow">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            New High Score Record!
          </div>
        )}

        {/* Run Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-4">
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-stone-400 font-medium">Distance</span>
            <span className="font-mono-numbers text-xl md:text-2xl font-bold text-amber-200">
              {stats.distance.toLocaleString()} <span className="text-xs text-amber-500 font-normal">m</span>
            </span>
          </div>

          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-stone-400 font-medium">Coins</span>
            <span className="font-mono-numbers text-xl md:text-2xl font-bold text-amber-300">
              +{stats.coins.toLocaleString()}
            </span>
          </div>

          <div className="col-span-2 bg-stone-950/80 border border-amber-900/50 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-amber-500 font-medium">Final Score</span>
            <span className="font-mono-numbers text-2xl md:text-3xl font-black text-amber-400">
              {stats.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Revive Button if player has coins and hasn't revived yet */}
        {!hasRevived && canRevive && (
          <button
            onClick={() => {
              setHasRevived(true);
              onRevive();
            }}
            className="w-full mb-3 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-stone-950 font-bold font-cinzel rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-102 active:scale-98 transition-all"
          >
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            <span>REVIVE WITH 250 COINS</span>
          </button>
        )}

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold font-cinzel text-lg rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-102 active:scale-98 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RUN AGAIN (SPACE)</span>
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onOpenShop}
              className="py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Upgrades</span>
            </button>

            <button
              onClick={onExitTitle}
              className="py-3 px-4 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
