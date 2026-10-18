import React from 'react';
import { X, Magnet, Shield, Zap, Sparkles, Check } from 'lucide-react';
import { sound } from '../game/audio';

export interface UpgradesState {
  magnetLevel: number;
  shieldLevel: number;
  boostLevel: number;
  multiplierLevel: number;
}

interface ShopModalProps {
  totalCoins: number;
  upgrades: UpgradesState;
  onUpgrade: (type: keyof UpgradesState, cost: number) => void;
  onClose: () => void;
}

const UPGRADE_COSTS = [150, 350, 750, 1500, 3000];

export const ShopModal: React.FC<ShopModalProps> = ({
  totalCoins,
  upgrades,
  onUpgrade,
  onClose,
}) => {
  const renderUpgradeCard = (
    key: keyof UpgradesState,
    title: string,
    desc: string,
    icon: React.ReactNode,
    level: number
  ) => {
    const isMax = level >= 5;
    const cost = isMax ? 0 : UPGRADE_COSTS[level - 1];
    const canAfford = !isMax && totalCoins >= cost;

    return (
      <div className="bg-stone-950/80 border border-amber-900/40 rounded-2xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-stone-900 rounded-xl border border-stone-700">
                {icon}
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-amber-200 text-base">{title}</h3>
                <span className="text-xs text-stone-400">Tier {level} / 5</span>
              </div>
            </div>

            {/* Level pips */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((pip) => (
                <div
                  key={pip}
                  className={`w-2.5 h-2.5 rounded-full ${
                    pip <= level ? 'bg-amber-400 box-gold-glow' : 'bg-stone-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-stone-400 mb-4">{desc}</p>
        </div>

        <button
          disabled={isMax || !canAfford}
          onClick={() => {
            if (canAfford) {
              sound.playPowerup();
              onUpgrade(key, cost);
            }
          }}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isMax
              ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
              : canAfford
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold hover:scale-102 active:scale-98'
              : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
          }`}
        >
          {isMax ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>MAXED OUT</span>
            </>
          ) : (
            <>
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
              <span>UPGRADE ({cost.toLocaleString()} COINS)</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-40 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-stone-900 border border-amber-800/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/40 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-cinzel text-xl md:text-2xl font-black text-amber-300">
              RELIC VAULT UPGRADES
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-950 px-3 py-1.5 rounded-xl border border-amber-900/60">
              <div className="w-4 h-4 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              <span className="font-mono-numbers font-bold text-amber-300 text-sm">
                {totalCoins.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderUpgradeCard(
            'magnetLevel',
            'Coin Magnet',
            'Increases magnet duration and draws coins from across all 3 lanes.',
            <Magnet className="w-5 h-5 text-cyan-400" />,
            upgrades.magnetLevel
          )}

          {renderUpgradeCard(
            'shieldLevel',
            'Sacred Shield',
            'Extends shield protection time and absorbs fatal obstacle collisions.',
            <Shield className="w-5 h-5 text-emerald-400" />,
            upgrades.shieldLevel
          )}

          {renderUpgradeCard(
            'boostLevel',
            'Phoenix Boost',
            'Increases invincible rocket sprint speed and adrenaline boost duration.',
            <Zap className="w-5 h-5 text-amber-400" />,
            upgrades.boostLevel
          )}

          {renderUpgradeCard(
            'multiplierLevel',
            'Treasure Multiplier',
            'Increases coin pickup values to 2x, 3x, 4x, and 5x base worth!',
            <Sparkles className="w-5 h-5 text-pink-400" />,
            upgrades.multiplierLevel
          )}
        </div>

        {/* Bottom Close */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-2xl transition-all cursor-pointer"
        >
          BACK TO TEMPLE
        </button>
      </div>
    </div>
  );
};
