/**
 * App Commands Service
 * 封装跨 Store 的业务逻辑操作
 */
import { useUIStore } from '../stores/useUIStore';
import { useSimulationStore } from '../stores/useSimulationStore';
import { useConfigStore } from '../stores/useConfigStore';
import { useDataStore } from '../stores/useDataStore';
import type { PresetSampleKey } from '../types';

/**
 * 加载预设
 */
export const loadPresetCommand = async (key: string): Promise<void> => {
  const { pause, resume } = useSimulationStore.getState();
  const { applyPresetConfig } = useConfigStore.getState();
  const { loadPreset } = useDataStore.getState();
  const { setPresetMenuOpen } = useUIStore.getState();

  pause();
  setPresetMenuOpen(false);

  const presetConfig = applyPresetConfig(key);
  if (!presetConfig) return;

  if (presetConfig.renderer === 'PARTICLE') {
    resume();
    return;
  }

  await loadPreset(key);
  resume();
};

/**
 * 手动编译数学函数
 */
export const compileCommand = (): void => {
  const { pause, resume, pointCount } = useSimulationStore.getState();
  const { tMin, tMax, scale, applyPresetConfig } = useConfigStore.getState();
  const { compileFunctions } = useDataStore.getState();

  pause();
  applyPresetConfig('CUSTOM');
  compileFunctions(tMin, tMax, scale, pointCount);
  resume();
};

/**
 * 处理图像
 */
export const processImageCommand = async (file: File): Promise<void> => {
  const { pause, resume, pointCount } = useSimulationStore.getState();
  const { applyPresetConfig } = useConfigStore.getState();
  const { processImage } = useDataStore.getState();

  pause();
  applyPresetConfig('IMAGE');
  await processImage(file, pointCount);
  resume();
};

/**
 * AI 生成
 */
export const processAICommand = async (prompt: string): Promise<void> => {
  const { pause, resume, pointCount } = useSimulationStore.getState();
  const { applyPresetConfig } = useConfigStore.getState();
  const { processAI } = useDataStore.getState();

  pause();
  applyPresetConfig('AI');
  await processAI(prompt, pointCount);
  resume();
};

/**
 * 加载示例
 */
export const processSampleCommand = async (key: PresetSampleKey): Promise<void> => {
  const { pause, resume, pointCount } = useSimulationStore.getState();
  const { applyPresetConfig } = useConfigStore.getState();
  const { processSample } = useDataStore.getState();

  pause();
  applyPresetConfig(`SAMPLE_${key}`);
  await processSample(key, pointCount);
  resume();
};
