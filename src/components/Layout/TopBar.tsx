/**
 * TopBar Component
 * 顶部栏：Logo + 预设菜单
 */

import type { FC } from 'react';
import { Sigma, ChevronDown } from 'lucide-react';
import { useUIStore, useConfigStore } from '../../stores';
import { PRESETS } from '../../constants/presets';

interface TopBarProps {
  onLoadPreset: (key: string) => void;
}

const TopBar: FC<TopBarProps> = ({ onLoadPreset }) => {
  const isPresetMenuOpen = useUIStore((s) => s.isPresetMenuOpen);
  const setPresetMenuOpen = useUIStore((s) => s.setPresetMenuOpen);
  const currentPresetKey = useConfigStore((s) => s.currentPresetKey);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-6 pointer-events-none">
      {/* Logo */}
      <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-3 pr-5 py-2 flex items-center gap-3 shadow-xl">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sigma className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white leading-none">
            Fourier<span className="font-light text-zinc-400">Architect</span>
          </h1>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
            傅里叶绘图师 v4.0
          </p>
        </div>
      </div>

      {/* Preset Menu */}
      <div className="pointer-events-auto relative">
        <button
          onClick={() => setPresetMenuOpen(!isPresetMenuOpen)}
          className="bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-black/80 rounded-full px-4 py-2.5 flex items-center gap-3 transition-all shadow-xl group"
        >
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-zinc-400">
            预设 (Preset)
          </span>
          <div className="w-px h-3 bg-zinc-800"></div>
          <span className="text-xs font-medium text-cyan-50 truncate max-w-[150px]">
            {PRESETS[currentPresetKey]?.label.replace(/.*:/, '').trim() || '自定义 (Custom)'}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${isPresetMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isPresetMenuOpen && (
          <div className="absolute right-0 top-full mt-3 w-64 bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
              {Object.entries(PRESETS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => onLoadPreset(key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between group ${currentPresetKey === key
                    ? 'bg-cyan-950/30 text-cyan-200'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                >
                  <span>{val.label.replace(/.*:/, '').trim()}</span>
                  {val.layers && (
                    <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-zinc-600 font-mono group-hover:text-zinc-400">
                      {val.layers.length}层
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
