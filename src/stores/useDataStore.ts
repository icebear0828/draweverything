/**
 * Data Store - 纯数据状态管理
 *
 * 职责：
 * - 路径数据管理
 * - 处理后的图层数据
 * - 加载状态和错误状态
 *
 * 业务逻辑已移至 services/DataProcessor.ts
 * 图层配置已移至 stores/useLayerStore.ts
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Complex, ProcessedLayer, PresetSampleKey } from '../types';
import {
  compileAndProcess,
  loadPresetData,
  processImageData,
  processAIData,
  processSampleData,
} from '../services/DataProcessor';
import { useLayerStore } from './useLayerStore';

// ============================================
// Types
// ============================================

interface DataState {
  pathsData: Complex[][];
  processedLayers: ProcessedLayer[];
  loading: boolean;
  error: string | null;
}

interface DataActions {
  setPathsData: (paths: Complex[][]) => void;
  setProcessedLayers: (layers: ProcessedLayer[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetError: () => void;

  // 高层操作 (委托给 Service)
  // Note: These operations coordinate with other stores. Prefer using AppCommands for
  // explicit cross-store orchestration in new code.
  compileFunctions: (tMin: number, tMax: number, scale: number, points: number) => Promise<void>;
  loadPreset: (key: string) => Promise<void>;
  processImage: (file: File, pointCount: number) => Promise<void>;
  processAI: (prompt: string, pointCount: number) => Promise<void>;
  processSample: (key: PresetSampleKey, pointCount: number) => Promise<void>;
}

export type DataStore = DataState & DataActions;

// ============================================
// Store
// ============================================

export const useDataStore = create<DataStore>()(
  subscribeWithSelector((set) => ({
    // State
    pathsData: [],
    processedLayers: [],
    loading: false,
    error: null,

    // Basic Setters
    setPathsData: (paths) => set({ pathsData: paths }),
    setProcessedLayers: (layers) => set({ processedLayers: layers }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    resetError: () => set({ error: null }),

    // 高层操作 - 委托给 DataProcessor Service
    // Note: 这些方法需要访问其他 Store 的数据。为保持向后兼容，
    // 它们内部会调用 useLayerStore.getState()。
    // 新代码应优先使用 AppCommands 进行跨 Store 编排。
    compileFunctions: async (tMin, tMax, scale, points) => {
      set({ loading: true, error: null });
      try {
        // 读取当前图层配置（跨 Store 访问）
        const { layersConfig } = useLayerStore.getState();
        const result = await compileAndProcess(layersConfig, { tMin, tMax, scale, points });
        set({
          pathsData: result.pathsData,
          processedLayers: result.processedLayers,
          loading: false,
        });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Math compilation failed.',
          loading: false,
        });
        console.error(err);
      }
    },

    loadPreset: async (key) => {
      set({ loading: true, error: null });
      try {
        const result = await loadPresetData(key);
        if (result) {
          useLayerStore.getState().setLayersConfig(result.layersConfig);
          set({
            pathsData: result.pathsData,
            processedLayers: result.processedLayers,
            loading: false,
          });
        } else {
          set({ loading: false });
        }
      } catch (e) {
        console.error(e);
        set({ error: 'Error generating preset.', loading: false });
      }
    },

    processImage: async (file, pointCount) => {
      set({ loading: true, error: null });
      try {
        const result = await processImageData(file, pointCount);
        useLayerStore.getState().setLayersConfig(result.layersConfig);
        set({
          pathsData: result.pathsData,
          processedLayers: result.processedLayers,
          loading: false,
        });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Failed to trace contours.',
          loading: false,
        });
      }
    },

    processAI: async (prompt, pointCount) => {
      set({ loading: true, error: null });
      try {
        const result = await processAIData(prompt, pointCount);
        useLayerStore.getState().setLayersConfig(result.layersConfig);
        set({
          pathsData: result.pathsData,
          processedLayers: result.processedLayers,
          loading: false,
        });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'AI Generation failed.',
          loading: false,
        });
      }
    },

    processSample: async (key, pointCount) => {
      set({ loading: true, error: null });
      try {
        const result = await processSampleData(key, pointCount);
        useLayerStore.getState().setLayersConfig(result.layersConfig);
        set({
          pathsData: result.pathsData,
          processedLayers: result.processedLayers,
          loading: false,
        });
      } catch {
        set({ error: 'Failed to load sample.', loading: false });
      }
    },
  }))
);
