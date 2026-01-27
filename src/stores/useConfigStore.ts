/**
 * Config Store - 管理配置状态
 *
 * 职责：
 * - 参数配置 (tMin, tMax, scale)
 * - 预设管理
 * - 渲染器选择
 * - 粒子公式配置
 */

import { create } from 'zustand';
import type { ConfigStore } from '../types';
import { PRESETS } from '../constants/presets';

const initialPreset = PRESETS['ALIEN_SIGNAL'];

export const useConfigStore = create<ConfigStore>((set, get) => ({
  // State
  tMin: initialPreset?.tMin ?? 0,
  tMax: initialPreset?.tMax ?? 2 * Math.PI,
  scale: initialPreset?.scale ?? 100,
  currentPresetKey: 'ALIEN_SIGNAL',
  currentRenderer: initialPreset?.renderer || 'PARTICLE',
  particleFormula: initialPreset?.particle,

  // Actions
  setTMin: (val) => set({ tMin: val }),
  setTMax: (val) => set({ tMax: val }),
  setScale: (val) => set({ scale: val }),
  setPresetKey: (key) => set({ currentPresetKey: key }),
  setRenderer: (renderer) => set({ currentRenderer: renderer }),
  setParticleFormula: (formula) => set({ particleFormula: formula }),

  applyPresetConfig: (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return null;

    const renderer = preset.renderer || 'FOURIER';

    set({
      tMin: preset.tMin,
      tMax: preset.tMax,
      scale: preset.scale,
      currentPresetKey: presetKey,
      currentRenderer: renderer,
      particleFormula: preset.particle,
    });

    return {
      tMin: preset.tMin,
      tMax: preset.tMax,
      scale: preset.scale,
      renderer,
      particle: preset.particle,
    };
  },
}));
