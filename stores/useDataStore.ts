/**
 * Data Store - 管理数据状态
 *
 * 职责：
 * - 路径数据管理
 * - 图层配置管理
 * - 处理后的图层数据
 * - 数据生成（数学函数、图片、AI）
 * - Web Worker 集成用于 DFT 计算
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Complex, MathLayer, ProcessedLayer } from '../types';
import { DataStore } from './types';
import { generateFromFunction, resamplePath, dft } from '../utils/math';
import { extractContourFromImage } from '../utils/imageProcessing';
import { generateCharacterImage } from '../services/gemini';
import { PRESETS } from '../constants/presets';
import { PRESET_URIS } from '../utils/presetShapes';
import { DFTRequest, DFTResponse, ProcessedLayerData } from '../workers/dft.types';

// ============================================
// Web Worker Setup
// ============================================

let dftWorker: Worker | null = null;
let pendingRequests: Map<string, {
  resolve: (layers: ProcessedLayer[]) => void;
  reject: (error: Error) => void;
}> = new Map();

// Initialize worker
const initWorker = (): Worker | null => {
  if (dftWorker) return dftWorker;

  try {
    dftWorker = new Worker(
      new URL('../workers/dft.worker.ts', import.meta.url),
      { type: 'module' }
    );

    dftWorker.onmessage = (event: MessageEvent<DFTResponse>) => {
      const { type, payload } = event.data;

      if (type === 'DFT_RESULT') {
        const request = pendingRequests.get(payload.id);
        if (request) {
          // Convert ProcessedLayerData to ProcessedLayer (compile modFn)
          const layers = payload.processedLayers.map(compileLayerData);
          request.resolve(layers);
          pendingRequests.delete(payload.id);
        }
      } else if (type === 'DFT_ERROR') {
        const request = pendingRequests.get(payload.id);
        if (request) {
          request.reject(new Error(payload.message));
          pendingRequests.delete(payload.id);
        }
      }
      // DFT_PROGRESS is ignored for now but could be used for UI updates
    };

    dftWorker.onerror = (error) => {
      console.error('DFT Worker error:', error);
      // Reject all pending requests
      pendingRequests.forEach((request) => {
        request.reject(new Error('Worker error'));
      });
      pendingRequests.clear();
    };

    return dftWorker;
  } catch (error) {
    console.warn('Failed to initialize DFT worker, falling back to main thread:', error);
    return null;
  }
};

// Generate unique request ID
let requestCounter = 0;
const generateRequestId = () => `dft-${++requestCounter}-${Date.now()}`;

// ============================================
// Helper Functions
// ============================================

// Compile modulation function from string
const compileModFn = (fnStr: string): ((t: number) => number) => {
  if (!fnStr) return () => 1;
  try {
    // eslint-disable-next-line no-new-func
    return new Function('t', `return ${fnStr};`) as (t: number) => number;
  } catch {
    return () => 1;
  }
};

// Convert ProcessedLayerData to ProcessedLayer
const compileLayerData = (data: ProcessedLayerData): ProcessedLayer => ({
  id: data.id,
  coefficients: data.coefficients,
  color: data.color,
  fillColor: data.fillColor,
  opacity: data.opacity,
  lineWidth: data.lineWidth,
  modFn: compileModFn(data.modFnStr),
});

// Process paths data using Web Worker (with fallback)
const computeDFTWithWorker = (
  pathsData: Complex[][],
  layersConfig: MathLayer[]
): Promise<ProcessedLayer[]> => {
  return new Promise((resolve, reject) => {
    const worker = initWorker();

    // Fallback to main thread if worker is not available
    if (!worker) {
      try {
        const layers = processPathsToLayersSync(pathsData, layersConfig);
        resolve(layers);
      } catch (error) {
        reject(error);
      }
      return;
    }

    const id = generateRequestId();
    pendingRequests.set(id, { resolve, reject });

    const request: DFTRequest = {
      type: 'COMPUTE_DFT',
      payload: {
        id,
        pathsData,
        layersConfig,
      },
    };

    worker.postMessage(request);
  });
};

// Synchronous fallback for when worker is not available
const processPathsToLayersSync = (
  pathsData: Complex[][],
  layersConfig: MathLayer[]
): ProcessedLayer[] => {
  if (pathsData.length === 0 || layersConfig.length === 0) {
    return [];
  }

  return pathsData.map((path, index) => {
    const config = layersConfig[index] || layersConfig[0];
    const coefficients = dft(path);

    return {
      id: `layer-${index}`,
      coefficients,
      color: config.colorHex,
      fillColor: config.fillColor,
      opacity: config.opacity ?? 1.0,
      lineWidth: config.lineWidth ?? 2.0,
      modFn: compileModFn(config.ampModFn || '1'),
    };
  });
};

// ============================================
// Store Definition
// ============================================

export const useDataStore = create<DataStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    pathsData: [],
    layersConfig: [],
    processedLayers: [],
    loading: false,
    error: null,

    // Basic Setters
    setPathsData: (paths) => set({ pathsData: paths }),
    setLayersConfig: (layers) => set({ layersConfig: layers }),
    setProcessedLayers: (layers) => set({ processedLayers: layers }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    resetError: () => set({ error: null }),

    // Layer Management
    addLayer: () => {
      const { layersConfig } = get();
      set({
        layersConfig: [
          ...layersConfig,
          {
            xFn: '5 * Math.cos(t)',
            yFn: '5 * Math.sin(t)',
            colorHex: '#f43f5e',
            lineWidth: 2,
            opacity: 1,
            ampModFn: '1',
          },
        ],
      });
    },

    removeLayer: (index) => {
      const { layersConfig } = get();
      if (layersConfig.length <= 1) return;
      set({
        layersConfig: layersConfig.filter((_, i) => i !== index),
      });
    },

    updateLayer: (index, updates) => {
      const { layersConfig } = get();
      const nextLayers = [...layersConfig];
      nextLayers[index] = { ...nextLayers[index], ...updates };
      set({ layersConfig: nextLayers });
    },

    // Data Generation Actions
    compileFunctions: async (tMin, tMax, scale, points) => {
      set({ loading: true, error: null });

      try {
        const { layersConfig } = get();
        const newPaths: Complex[][] = layersConfig.map((layer) => {
          const s = layer.scaleMod ? scale * layer.scaleMod : scale;
          const data = generateFromFunction(
            layer.xFn,
            layer.yFn,
            tMin,
            tMax,
            points,
            s,
            true,
            layer.isPolar
          );
          if (data.length === 0) throw new Error('Layer produced empty path. Check syntax.');
          return data;
        });

        // Use Web Worker for DFT computation
        const processedLayers = await computeDFTWithWorker(newPaths, layersConfig);

        set({
          pathsData: newPaths,
          processedLayers,
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
      const preset = PRESETS[key];
      if (!preset) return;

      set({ loading: true, error: null });

      try {
        const newPaths: Complex[][] = [];
        const newLayers: MathLayer[] = [];

        if (preset.layers && preset.layers.length > 0) {
          preset.layers.forEach((layer) => {
            const s = layer.scaleMod ? preset.scale * layer.scaleMod : preset.scale;
            const data = generateFromFunction(
              layer.xFn,
              layer.yFn,
              preset.tMin,
              preset.tMax,
              2048,
              s,
              false,
              layer.isPolar
            );
            if (data.length > 0) {
              newPaths.push(data);
              newLayers.push({ ...layer, ampModFn: layer.ampModFn || '1' });
            }
          });
        } else if (preset.xFn && preset.yFn) {
          const data = generateFromFunction(
            preset.xFn,
            preset.yFn,
            preset.tMin,
            preset.tMax,
            2048,
            preset.scale,
            false
          );
          newPaths.push(data);
          newLayers.push({
            xFn: preset.xFn,
            yFn: preset.yFn,
            colorHex: '#22d3ee',
            opacity: 1,
            lineWidth: 2,
            ampModFn: '1',
          });
        }

        // Use Web Worker for DFT computation
        const processedLayers = await computeDFTWithWorker(newPaths, newLayers);

        set({
          pathsData: newPaths,
          layersConfig: newLayers,
          processedLayers,
          loading: false,
        });
      } catch (e) {
        console.error(e);
        set({
          error: 'Error generating preset.',
          loading: false,
        });
      }
    },

    processImage: async (file, pointCount) => {
      set({ loading: true, error: null });

      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            try {
              const points = await extractContourFromImage(event.target.result as string);
              if (points.length < 20) throw new Error('Could not detect a clear path.');

              const complexData = resamplePath(points, pointCount);
              const newLayers: MathLayer[] = [
                {
                  xFn: 'IMAGE_TRACE',
                  yFn: 'IMAGE_TRACE',
                  colorHex: '#d946ef',
                  opacity: 1,
                  lineWidth: 2,
                  ampModFn: '1',
                },
              ];

              // Use Web Worker for DFT computation
              const processedLayers = await computeDFTWithWorker([complexData], newLayers);

              set({
                pathsData: [complexData],
                layersConfig: newLayers,
                processedLayers,
                loading: false,
              });
            } catch (err) {
              set({
                error: err instanceof Error ? err.message : 'Failed to trace contours.',
                loading: false,
              });
            }
          }
          resolve();
        };
        reader.onerror = () => {
          set({ error: 'Failed to read file.', loading: false });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    },

    processAI: async (prompt, pointCount) => {
      set({ loading: true, error: null });

      try {
        const b64Image = await generateCharacterImage(prompt);
        const points = await extractContourFromImage(b64Image);
        if (points.length < 20) throw new Error('Generated image was too complex to trace.');

        const complexData = resamplePath(points, pointCount);
        const newLayers: MathLayer[] = [
          {
            xFn: 'AI_GEN',
            yFn: 'AI_GEN',
            colorHex: '#facc15',
            opacity: 1,
            lineWidth: 2,
            ampModFn: '1',
          },
        ];

        // Use Web Worker for DFT computation
        const processedLayers = await computeDFTWithWorker([complexData], newLayers);

        set({
          pathsData: [complexData],
          layersConfig: newLayers,
          processedLayers,
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
        const uri = PRESET_URIS[key];
        const points = await extractContourFromImage(uri);
        if (points.length < 20) throw new Error('Could not detect a clear path.');

        const complexData = resamplePath(points, pointCount);
        const newLayers: MathLayer[] = [
          {
            xFn: 'IMAGE_TRACE',
            yFn: 'IMAGE_TRACE',
            colorHex: '#fbbf24',
            opacity: 1,
            lineWidth: 3,
            fillColor: '#fbbf2420',
            ampModFn: '1',
          },
        ];

        // Use Web Worker for DFT computation
        const processedLayers = await computeDFTWithWorker([complexData], newLayers);

        set({
          pathsData: [complexData],
          layersConfig: newLayers,
          processedLayers,
          loading: false,
        });
      } catch {
        set({
          error: 'Failed to load sample.',
          loading: false,
        });
      }
    },
  }))
);
