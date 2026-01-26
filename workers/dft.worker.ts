/**
 * DFT Web Worker
 * 在后台线程计算离散傅里叶变换，避免阻塞主线程
 */

import { Complex, FourierCoefficient, MathLayer } from '../types';
import { DFTRequest, DFTResponse, ProcessedLayerData } from './dft.types';

/**
 * Discrete Fourier Transform implementation
 * Optimized for Web Worker environment
 */
const dft = (x: Complex[]): FourierCoefficient[] => {
  const X: FourierCoefficient[] = [];
  const N = x.length;
  if (N === 0) return [];

  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;

    const angleConst = (2 * Math.PI * k) / N;

    for (let n = 0; n < N; n++) {
      const phi = angleConst * n;
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);

      re += x[n].re * cos + x[n].im * sin;
      im += x[n].im * cos - x[n].re * sin;
    }

    re = re / N;
    im = im / N;

    const freq = k > N / 2 ? k - N : k;
    const amp = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);

    X.push({ re, im, freq, amp, phase });
  }

  // Sort by amplitude (descending) for better visualization
  return X.sort((a, b) => b.amp - a.amp);
};

/**
 * Process paths data into layer data with DFT coefficients
 */
const processPathsToLayers = (
  pathsData: Complex[][],
  layersConfig: MathLayer[]
): ProcessedLayerData[] => {
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
      modFnStr: config.ampModFn || '1',
    };
  });
};

// ============================================
// Worker Message Handler
// ============================================

self.onmessage = (event: MessageEvent<DFTRequest>) => {
  const { type, payload } = event.data;

  if (type === 'COMPUTE_DFT') {
    const { id, pathsData, layersConfig } = payload;

    try {
      // Send progress update
      const progressResponse: DFTResponse = {
        type: 'DFT_PROGRESS',
        payload: {
          id,
          progress: 10,
          message: 'Starting DFT computation...',
        },
      };
      self.postMessage(progressResponse);

      // Compute DFT
      const processedLayers = processPathsToLayers(pathsData, layersConfig);

      // Send progress update
      const progressResponse2: DFTResponse = {
        type: 'DFT_PROGRESS',
        payload: {
          id,
          progress: 90,
          message: 'Finalizing results...',
        },
      };
      self.postMessage(progressResponse2);

      // Send result
      const resultResponse: DFTResponse = {
        type: 'DFT_RESULT',
        payload: {
          id,
          processedLayers,
        },
      };
      self.postMessage(resultResponse);
    } catch (error) {
      const errorResponse: DFTResponse = {
        type: 'DFT_ERROR',
        payload: {
          id,
          message: error instanceof Error ? error.message : 'Unknown error in DFT computation',
        },
      };
      self.postMessage(errorResponse);
    }
  }
};

// Export for TypeScript module resolution
export {};
