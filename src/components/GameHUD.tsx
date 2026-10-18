import React, { useState } from 'react';
import { Pause, Volume2, VolumeX, Shield, Zap, Magnet, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Smartphone } from 'lucide-react';
import type { GameStats } from '../game/engine';

interface GameHUDProps {
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onJump: () => void;
  onSlide: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onTurnLeft: () => void;
  onTurnRight: () => void;
  onActivateAdrenaline: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onPause,
  onJump,
  onSlide,
  onMoveLeft,
  onMoveRight,
  onTurnLeft,
  onTurnRight,
  onActivateAdrenaline,
}) => {
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Is the demon dangerously close?
  const isDemonClose = stats.demonDistance <= 6;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none z-10">
      {/* Top Status Cluster: Unobstructed Center (Playfield 85%+ open) */}
      <div className="w-full flex items-start justify-between">
        {/* Left: Distance & Multiplier */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="bg-stone-950/80 border border-amber-800/40 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Distance</span>
            <span className="font-mono-numbers font-bold text-lg md:text-xl text-amber-200">
              {stats.distance.toLocaleString()} <span className="text-xs text-amber-500 font-normal">m</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-amber-950/80 border border-amber-700/50 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-amber-300">
              {stats.speed} km/h
            </span>
            {stats.multiplier > 1 && (
              <span className="bg-rose-950/80 border border-rose-600/50 px-2 py-0.5 rounded-lg text-xs font-bold text-rose-300">
                {stats.multiplier}x Multiplier
              </span>
            )}
            {stats.hasShield && (
              <span className="bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-lg text-xs font-bold text-emerald-300 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" /> Shield Active
              </span>
            )}
          </div>
        </div>

        {/* Top-Center: Beast Danger Alert when beast is close */}
        <div className="flex flex-col items-center pointer-events-auto">
          {isDemonClose && (
            <div className="bg-red-950/90 border border-red-500/80 px-4 py-1.5 rounded-full shadow-lg box-danger-glow flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs md:text-sm font-bold text-red-200 tracking-wider uppercase font-cinzel">
                DEMON AT YOUR HEELS ({stats.demonDistance}m)
              </span>
            </div>
          )}

          {/* Active Powerup Pill */}
          {stats.activePowerup && (
            <div className="mt-2 bg-stone-900/90 border border-amber-500/60 px-3 py-1 rounded-full flex items-center gap-2 shadow-md">
              {stats.activePowerup.type === 'magnet' && <Magnet className="w-4 h-4 text-cyan-400" />}
              {stats.activePowerup.type === 'shield' && <Shield className="w-4 h-4 text-emerald-400" />}
              {stats.activePowerup.type === 'boost' && <Zap className="w-4 h-4 text-amber-400" />}
              {stats.activePowerup.type === 'multiplier' && <Sparkles className="w-4 h-4 text-pink-400" />}
              <span className="text-xs font-bold uppercase text-stone-200">
                {stats.activePowerup.type}
              </span>
              <span className="font-mono-numbers text-xs text-amber-300 font-bold">
                {stats.activePowerup.remaining}s
              </span>
            </div>
          )}
        </div>

        {/* Right: Coins, Pause, Touch Toggle, Mute */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-stone-950/80 border border-amber-800/40 px-3.5 py-1.5 rounded-xl shadow-lg">
            <div className="w-4 h-4 rounded-full bg-amber-400 border border-amber-200 shadow-sm shadow-amber-500" />
            <span className="font-mono-numbers font-bold text-lg md:text-xl text-amber-300">
              {stats.coins.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTouchControls(!showTouchControls)}
              title="Toggle On-Screen Touch Controls"
              className="p-2 bg-stone-950/80 border border-amber-900/40 hover:border-amber-600 rounded-xl text-stone-300 hover:text-amber-200 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              title="Toggle Audio"
              className="p-2 bg-stone-950/80 border border-amber-900/40 hover:border-amber-600 rounded-xl text-stone-300 hover:text-amber-200 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onPause}
              title="Pause Game (Esc)"
              className="p-2 bg-stone-950/80 border border-amber-900/40 hover:border-amber-600 rounded-xl text-stone-300 hover:text-amber-200 transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Adrenaline Power Meter + Optional Touch D-Pad */}
      <div className="w-full flex items-end justify-between">
        {/* Adrenaline Power-Boost Bar */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Adrenaline
            </span>
            <span className="font-mono-numbers text-stone-300">{stats.adrenaline}%</span>
          </div>

          <div className="w-40 md:w-56 h-3 bg-stone-950/90 rounded-full border border-amber-900/60 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                stats.adrenaline >= 100
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-200 box-gold-glow'
                  : 'bg-gradient-to-r from-amber-700 to-amber-500'
              }`}
              style={{ width: `${stats.adrenaline}%` }}
            />
          </div>

          {stats.adrenaline >= 100 && (
            <button
              onClick={onActivateAdrenaline}
              className="mt-1 py-1 px-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-bold text-xs rounded-lg shadow-lg border border-amber-200 cursor-pointer hover:scale-105 active:scale-95 transition-all text-center"
            >
              BOOST READY (Press F / Space)
            </button>
          )}
        </div>

        {/* Optional On-Screen D-Pad Buttons for Mobile / Touch screens */}
        {showTouchControls && (
          <div className="flex flex-col items-center gap-2 pointer-events-auto bg-stone-950/80 p-3 rounded-2xl border border-amber-900/40 shadow-xl">
            {/* Top row: Jump */}
            <button
              onClick={onJump}
              className="p-3 bg-stone-800 hover:bg-stone-700 active:bg-amber-600 border border-stone-600 rounded-xl text-stone-200 active:text-stone-950 transition-colors"
              aria-label="Jump"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            {/* Middle row: Left, Turn L, Turn R, Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onTurnLeft();
                  onMoveLeft();
                }}
                className="p-3 bg-stone-800 hover:bg-stone-700 active:bg-amber-600 border border-stone-600 rounded-xl text-stone-200 active:text-stone-950 transition-colors"
                aria-label="Left"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={onSlide}
                className="p-3 bg-stone-800 hover:bg-stone-700 active:bg-amber-600 border border-stone-600 rounded-xl text-stone-200 active:text-stone-950 transition-colors"
                aria-label="Slide"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  onTurnRight();
                  onMoveRight();
                }}
                className="p-3 bg-stone-800 hover:bg-stone-700 active:bg-amber-600 border border-stone-600 rounded-xl text-stone-200 active:text-stone-950 transition-colors"
                aria-label="Right"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
