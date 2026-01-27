/**
 * Layer Store - 图层配置管理
 *
 * 职责：
 * - 图层配置状态
 * - 图层 CRUD 操作
 */

import { create } from 'zustand';
import type { MathLayer } from '../types';

// ============================================
// Types
// ============================================

export interface LayerState {
  layersConfig: MathLayer[];
}

export interface LayerActions {
  setLayersConfig: (layers: MathLayer[]) => void;
  addLayer: () => void;
  removeLayer: (index: number) => void;
  updateLayer: (index: number, updates: Partial<MathLayer>) => void;
  resetLayers: () => void;
}

export type LayerStore = LayerState & LayerActions;

// ============================================
// Constants
// ============================================

const DEFAULT_LAYER: MathLayer = {
  xFn: '5 * Math.cos(t)',
  yFn: '5 * Math.sin(t)',
  colorHex: '#f43f5e',
  lineWidth: 2,
  opacity: 1,
  ampModFn: '1',
};

// ============================================
// Store
// ============================================

export const useLayerStore = create<LayerStore>()((set, get) => ({
  // State
  layersConfig: [],

  // Actions
  setLayersConfig: (layers) => set({ layersConfig: layers }),

  addLayer: () => {
    const { layersConfig } = get();
    set({ layersConfig: [...layersConfig, { ...DEFAULT_LAYER }] });
  },

  removeLayer: (index) => {
    const { layersConfig } = get();
    if (layersConfig.length <= 1) return;
    set({ layersConfig: layersConfig.filter((_, i) => i !== index) });
  },

  updateLayer: (index, updates) => {
    const { layersConfig } = get();
    const nextLayers = [...layersConfig];
    nextLayers[index] = { ...nextLayers[index], ...updates };
    set({ layersConfig: nextLayers });
  },

  resetLayers: () => set({ layersConfig: [] }),
}));
