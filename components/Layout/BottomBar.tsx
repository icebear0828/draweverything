/**
 * BottomBar Component
 * 底部栏：播放控制 + 速度 + 设置按钮
 */

import React from 'react';
import { Play, Pause, Settings2 } from 'lucide-react';
import { useUIStore, useSimulationStore, useConfigStore } from '../../stores';

const BottomBar: React.FC = () => {
  const isInspectorOpen = useUIStore((s) => s.isInspectorOpen);
  const setInspectorOpen = useUIStore((s) => s.setInspectorOpen);

  const isRunning = useSimulationStore((s) => s.isRunning);
  const speed = useSimulationStore((s) => s.speed);
  const setRunning = useSimulationStore((s) => s.setRunning);
  const setSpeed = useSimulationStore((s) => s.setSpeed);

  const currentRenderer = useConfigStore((s) => s.currentRenderer);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-4 shadow-2xl ring-1 ring-white/5 pl-6 pr-6 h-14">
        {/* Play/Pause Button */}
        <button
          onClick={() => setRunning(!isRunning)}
          className="w-10 h-10 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {isRunning ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <div className="w-px h-6 bg-white/10"></div>

        {/* Speed Control */}
        <div className="flex flex-col gap-1 w-32">
          <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
            <span>速度 (Speed)</span>
            <span className="text-cyan-400">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="4"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
          />
        </div>

        <div className="w-px h-6 bg-white/10"></div>

        {/* Inspector Toggle */}
        <button
          onClick={() => setInspectorOpen(!isInspectorOpen)}
          disabled={currentRenderer === 'PARTICLE'}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
            isInspectorOpen
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          } ${currentRenderer === 'PARTICLE' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Settings2 className="w-4 h-4" />
          <span>控制面板</span>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
