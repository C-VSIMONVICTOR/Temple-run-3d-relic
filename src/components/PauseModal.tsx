import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitTitle,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 z-30 select-none">
      <div className="w-full max-w-sm bg-stone-900 border border-amber-800/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="font-cinzel text-3xl font-extrabold text-amber-300 tracking-wider mb-2">
          PAUSED
        </h2>
        <p className="text-stone-400 text-sm mb-6">
          The temple beast awaits your next move.
        </p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold font-cinzel rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-102 active:scale-98 transition-all"
          >
            <Play className="w-5 h-5 fill-stone-950" />
            <span>RESUME (ESC)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-6 bg-stone-800 hover:bg-stone-700 border border-stone-600/70 text-stone-200 font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-3 px-6 bg-stone-800 hover:bg-stone-700 border border-stone-600/70 text-stone-200 font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onExitTitle}
            className="w-full py-3 px-6 bg-stone-950/80 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
