/**
 * BottomBar Component
 * 底部栏：图层切换 + 播放控制 + 速度
 */

import React from 'react';
import { Play, Pause, Sparkles, Circle } from 'lucide-react';
import { useSimulationStore, useConfigStore } from '../../stores';

const BottomBar: React.FC = () => {
  const isRunning = useSimulationStore((s) => s.isRunning);
  const speed = useSimulationStore((s) => s.speed);
  const setRunning = useSimulationStore((s) => s.setRunning);
  const setSpeed = useSimulationStore((s) => s.setSpeed);

  const showParticle = useConfigStore((s) => s.showParticle);
  const showFourier = useConfigStore((s) => s.showFourier);
  const toggleParticle = useConfigStore((s) => s.toggleParticle);
  const toggleFourier = useConfigStore((s) => s.toggleFourier);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-3 shadow-2xl ring-1 ring-white/5 px-4 h-12">
        {/* Layer Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleParticle}
            title="粒子层 (Particle)"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              showParticle
                ? 'bg-purple-500/30 text-purple-400 ring-1 ring-purple-500/50'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFourier}
            title="FFT 层 (Fourier)"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              showFourier
                ? 'bg-cyan-500/30 text-cyan-400 ring-1 ring-cyan-500/50'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-white/10"></div>

        {/* Play/Pause Button */}
        <button
          onClick={() => setRunning(!isRunning)}
          className="w-9 h-9 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]"
        >
          {isRunning ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        <div className="w-px h-5 bg-white/10"></div>

        {/* Speed Control */}
        <div className="flex items-center gap-2 w-28">
          <input
            type="range"
            min="0.1"
            max="4"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
          />
          <span className="text-[10px] text-cyan-400 font-mono w-8 text-right">
            {speed.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
};

export default BottomBar;
