/**
 * PresetPanel Component
 * 分类预设选择面板
 */

import React, { useState, useMemo } from 'react';
import { PRESETS, PRESET_CATEGORIES } from '../constants/presets';
import type { PresetCategory } from '../types';

interface PresetPanelProps {
  onSelectPreset: (key: string) => void;
  currentPresetKey?: string;
}

const PresetPanel: React.FC<PresetPanelProps> = ({
  onSelectPreset,
  currentPresetKey
}) => {
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('particle');

  // 按分类过滤预设
  const filteredPresets = useMemo(() => {
    return Object.entries(PRESETS).filter(
      ([, preset]) => (preset.category || 'fourier') === activeCategory
    );
  }, [activeCategory]);

  return (
    <div className="w-full">
      {/* 分类标签 */}
      <div className="flex gap-2 mb-4">
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${activeCategory === cat.id
                ? 'bg-white/10 text-white ring-1 ring-white/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 预设网格 */}
      <div className="grid grid-cols-4 gap-3">
        {filteredPresets.map(([key, preset]) => (
          <button
            key={key}
            onClick={() => onSelectPreset(key)}
            className={`
              group relative flex flex-col items-center justify-center
              p-4 rounded-xl border transition-all duration-200
              ${currentPresetKey === key
                ? 'bg-white/10 border-white/30 ring-2 ring-white/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }
            `}
          >
            {/* 缩略图 */}
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              {preset.thumbnail || '📐'}
            </span>
            {/* 标签 */}
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 text-center truncate w-full">
              {preset.label}
            </span>
            {/* 当前选中指示 */}
            {currentPresetKey === key && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
            )}
          </button>
        ))}

        {/* 自定义按钮 */}
        <button
          onClick={() => onSelectPreset('CUSTOM')}
          className="
            group flex flex-col items-center justify-center
            p-4 rounded-xl border border-dashed border-white/20
            hover:bg-white/5 hover:border-white/30 transition-all duration-200
          "
        >
          <span className="text-2xl mb-2 text-zinc-600 group-hover:text-zinc-400">+</span>
          <span className="text-xs text-zinc-600 group-hover:text-zinc-400">自定义</span>
        </button>
      </div>

      {/* 分类描述 */}
      <p className="mt-4 text-xs text-zinc-600 text-center">
        {PRESET_CATEGORIES.find(c => c.id === activeCategory)?.description}
      </p>
    </div>
  );
};

export default PresetPanel;
