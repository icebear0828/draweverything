/**
 * TopSection Component
 * 顶部区域：Logo + CommandBar + PresetPanel
 */

import { useState, type FC } from 'react';
import { Sigma, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import CommandBar from './CommandBar';
import PresetPanel from './PresetPanel';
import { useConfigStore, useDataStore } from '../stores';

interface TopSectionProps {
  onLoadPreset: (key: string) => void;
  onSubmitFunction: (input: string) => void;
  onSubmitAI: (prompt: string) => void;
  onOpenSettings?: () => void;
}

const TopSection: FC<TopSectionProps> = ({
  onLoadPreset,
  onSubmitFunction,
  onSubmitAI,
  onOpenSettings
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentPresetKey = useConfigStore((s) => s.currentPresetKey);
  const loading = useDataStore((s) => s.loading);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="p-4 md:p-6">
        {/* 顶部行：Logo + 设置 */}
        <div className="flex justify-between items-center mb-4 pointer-events-auto">
          {/* Logo */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-3 pr-5 py-2 flex items-center gap-3 shadow-xl">
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

          {/* 右侧按钮 */}
          <div className="flex items-center gap-2">
            {/* 展开/收起 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              title={isExpanded ? '收起面板' : '展开面板'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* 设置按钮 */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                title="高级设置"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 可展开区域 */}
        <div
          className={`
            transition-all duration-500 ease-out overflow-hidden
            ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="pointer-events-auto space-y-4">
            {/* CommandBar */}
            <CommandBar
              onSubmitFunction={onSubmitFunction}
              onSubmitAI={onSubmitAI}
              loading={loading}
            />

            {/* PresetPanel */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
              <PresetPanel
                onSelectPreset={onLoadPreset}
                currentPresetKey={currentPresetKey}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopSection;
