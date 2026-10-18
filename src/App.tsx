/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TempleRunEngine, type GameState, type GameStats } from './game/engine';
import { sound } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal, type UpgradesState } from './components/ShopModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TempleRunEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showShop, setShowShop] = useState(false);

  // High Scores & Banked Coins (Persisted in localStorage)
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('temple_run_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [bestDistance, setBestDistance] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('temple_run_bestdist') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [totalCoins, setTotalCoins] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('temple_run_coins') || '250', 10);
    } catch {
      return 250;
    }
  });

  const [upgrades, setUpgrades] = useState<UpgradesState>(() => {
    try {
      const saved = localStorage.getItem('temple_run_upgrades');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      magnetLevel: 1,
      shieldLevel: 1,
      boostLevel: 1,
      multiplierLevel: 1,
    };
  });

  // Current Live Stats
  const [stats, setStats] = useState<GameStats>({
    distance: 0,
    coins: 0,
    score: 0,
    multiplier: 1,
    speed: 22,
    adrenaline: 0,
    activePowerup: null,
    demonDistance: 14,
    isStumbling: false,
    hasShield: false,
  });

  // Convert upgrade levels to multipliers for the engine
  const applyEngineUpgrades = useCallback((engine: TempleRunEngine, currentUpgrades: UpgradesState) => {
    engine.loadUpgrades({
      magnetDuration: 1.0 + (currentUpgrades.magnetLevel - 1) * 0.35,
      shieldDuration: 1.0 + (currentUpgrades.shieldLevel - 1) * 0.35,
      boostDuration: 1.0 + (currentUpgrades.boostLevel - 1) * 0.3,
      coinValue: currentUpgrades.multiplierLevel,
    });
  }, []);

  // Mount Three.js Engine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new TempleRunEngine(canvasMountRef.current);
    engineRef.current = engine;
    applyEngineUpgrades(engine, upgrades);

    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    engine.onGameOver = (finalStats) => {
      setGameState('GAMEOVER');

      // Update total coins
      setTotalCoins((prev) => {
        const nextCoins = prev + finalStats.coins;
        try {
          localStorage.setItem('temple_run_coins', String(nextCoins));
        } catch {
          // Ignore
        }
        return nextCoins;
      });

      // Update High Score
      setHighScore((prevHigh) => {
        if (finalStats.score > prevHigh) {
          try {
            localStorage.setItem('temple_run_highscore', String(finalStats.score));
          } catch {
            // Ignore
          }
          return finalStats.score;
        }
        return prevHigh;
      });

      // Update Best Distance
      setBestDistance((prevDist) => {
        if (finalStats.distance > prevDist) {
          try {
            localStorage.setItem('temple_run_bestdist', String(finalStats.distance));
          } catch {
            // Ignore
          }
          return finalStats.distance;
        }
        return prevDist;
      });
    };

    return () => {
      engine.cleanup();
      engineRef.current = null;
    };
  }, [applyEngineUpgrades]);

  // Touch Swipe Gesture Detection
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: performance.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;
    const dt = performance.now() - touchStartRef.current.time;

    const threshold = 35;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx < 0) {
          // Swipe Left
          engineRef.current?.handleTurn('LEFT');
          engineRef.current?.handleLaneChange('LEFT');
        } else {
          // Swipe Right
          engineRef.current?.handleTurn('RIGHT');
          engineRef.current?.handleLaneChange('RIGHT');
        }
      } else {
        // Vertical swipe
        if (dy < 0) {
          // Swipe Up: Jump
          engineRef.current?.handleJump();
        } else {
          // Swipe Down: Slide
          engineRef.current?.handleSlide();
        }
      }
    } else if (dt < 250) {
      // Tap: Adrenaline boost if full
      engineRef.current?.activateAdrenaline();
    }
    touchStartRef.current = null;
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') {
          engineRef.current?.pauseGame();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          engineRef.current?.resumeGame();
          setGameState('PLAYING');
        }
        return;
      }

      if (gameState === 'TITLE') {
        if (e.key === ' ' || e.key === 'Enter') {
          startGame();
        }
        return;
      }

      if (gameState === 'GAMEOVER') {
        if (e.key === ' ' || e.key === 'Enter') {
          restartGame();
        }
        return;
      }

      if (gameState === 'PLAYING') {
        // Turning or Lane change
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          engineRef.current?.handleTurn('LEFT');
          engineRef.current?.handleLaneChange('LEFT');
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          engineRef.current?.handleTurn('RIGHT');
          engineRef.current?.handleLaneChange('RIGHT');
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
          engineRef.current?.handleJump();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          engineRef.current?.handleSlide();
        } else if (e.key === 'f' || e.key === 'F') {
          engineRef.current?.activateAdrenaline();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const startGame = () => {
    sound.resume();
    engineRef.current?.startGame();
    setGameState('PLAYING');
  };

  const restartGame = () => {
    sound.resume();
    engineRef.current?.startGame();
    setGameState('PLAYING');
  };

  const resumeGame = () => {
    engineRef.current?.resumeGame();
    setGameState('PLAYING');
  };

  const exitToTitle = () => {
    if (engineRef.current) {
      engineRef.current.gameState = 'TITLE';
      engineRef.current.resetTrack();
    }
    setGameState('TITLE');
    sound.stopMusic();
  };

  const reviveGame = () => {
    if (totalCoins >= 250) {
      const nextCoins = totalCoins - 250;
      setTotalCoins(nextCoins);
      try {
        localStorage.setItem('temple_run_coins', String(nextCoins));
      } catch {
        // Ignore
      }
      engineRef.current?.revive();
      setGameState('PLAYING');
    }
  };

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleUpgrade = (type: keyof UpgradesState, cost: number) => {
    if (totalCoins < cost) return;
    const nextCoins = totalCoins - cost;
    const nextUpgrades = {
      ...upgrades,
      [type]: upgrades[type] + 1,
    };
    setTotalCoins(nextCoins);
    setUpgrades(nextUpgrades);
    try {
      localStorage.setItem('temple_run_coins', String(nextCoins));
      localStorage.setItem('temple_run_upgrades', JSON.stringify(nextUpgrades));
    } catch {
      // Ignore
    }
    if (engineRef.current) {
      applyEngineUpgrades(engineRef.current, nextUpgrades);
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Canvas Isolated Ref Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Screen States */}
      {gameState === 'TITLE' && !showShop && (
        <TitleScreen
          onStart={startGame}
          onOpenShop={() => setShowShop(true)}
          highScore={highScore}
          bestDistance={bestDistance}
          totalCoins={totalCoins}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameHUD
          stats={stats}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={() => {
            engineRef.current?.pauseGame();
            setGameState('PAUSED');
          }}
          onJump={() => engineRef.current?.handleJump()}
          onSlide={() => engineRef.current?.handleSlide()}
          onMoveLeft={() => engineRef.current?.handleLaneChange('LEFT')}
          onMoveRight={() => engineRef.current?.handleLaneChange('RIGHT')}
          onTurnLeft={() => engineRef.current?.handleTurn('LEFT')}
          onTurnRight={() => engineRef.current?.handleTurn('RIGHT')}
          onActivateAdrenaline={() => engineRef.current?.activateAdrenaline()}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={resumeGame}
          onRestart={restartGame}
          onExitTitle={exitToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'GAMEOVER' && !showShop && (
        <GameOverModal
          stats={stats}
          highScore={highScore}
          bestDistance={bestDistance}
          totalCoins={totalCoins}
          onRestart={restartGame}
          onRevive={reviveGame}
          onExitTitle={exitToTitle}
          onOpenShop={() => setShowShop(true)}
        />
      )}

      {showShop && (
        <ShopModal
          totalCoins={totalCoins}
          upgrades={upgrades}
          onUpgrade={handleUpgrade}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}
