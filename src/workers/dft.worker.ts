/**
 * DFT Web Worker
 * 在后台线程计算离散傅里叶变换，避免阻塞主线程
 *
 * 使用与主线程相同的 FFT 核心算法，确保一致性
 */

import type { Complex, FourierCoefficient, MathLayer } from '../types';
import type { DFTRequest, DFTResponse, ProcessedLayerData } from './dft.types';
import { isPowerOf2, fftCore, dftCore, bluesteinFFT } from '../utils/fft-core';

// FFT threshold - use direct DFT for small inputs
const USE_FFT_THRESHOLD = 64;

/**
 * DFT with FFT optimization
 * Algorithm selection:
 * - N < 64: use direct DFT
 * - N is power of 2: use Cooley-Tukey FFT
 * - N is not power of 2: use Bluestein FFT (exact, O(N log N))
 */
const dft = (x: Complex[]): FourierCoefficient[] => {
  const N = x.length;
  if (N === 0) return [];

  let rawResult: Complex[];

  if (N < USE_FFT_THRESHOLD) {
    // Small input: use direct DFT
    rawResult = dftCore(x);
  } else if (isPowerOf2(N)) {
    // Power of 2: use Cooley-Tukey FFT
    rawResult = fftCore(x);
  } else {
    // Non-power-of-2: use Bluestein FFT for exact results
    rawResult = bluesteinFFT(x);
  }

  const coefficients: FourierCoefficient[] = rawResult.map((c, k) => {
    const re = c.re / N;
    const im = c.im / N;
    const freq = k > N / 2 ? k - N : k;
    const amp = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);

    return { re, im, freq, amp, phase };
  });

  return coefficients.sort((a, b) => b.amp - a.amp);
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
