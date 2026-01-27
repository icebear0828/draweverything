/**
 * DFT Web Worker
 * 在后台线程计算离散傅里叶变换，避免阻塞主线程
 * 使用 FFT 优化 (O(N log N))
 */

import { Complex, FourierCoefficient, MathLayer } from '../types';
import { DFTRequest, DFTResponse, ProcessedLayerData } from './dft.types';

// ============================================
// FFT Implementation (inlined for worker)
// ============================================

const isPowerOf2 = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

const nextPowerOf2 = (n: number): number => {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
};

const bitReverse = (arr: Complex[], n: number): void => {
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    let reversed = 0;
    let num = i;
    for (let j = 0; j < bits; j++) {
      reversed = (reversed << 1) | (num & 1);
      num >>= 1;
    }
    if (reversed > i) {
      const temp = arr[i];
      arr[i] = arr[reversed];
      arr[reversed] = temp;
    }
  }
};

const fftCore = (x: Complex[]): Complex[] => {
  const n = x.length;
  const result: Complex[] = x.map(c => ({ re: c.re, im: c.im }));

  bitReverse(result, n);

  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const angleStep = -2 * Math.PI / size;

    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const angle = angleStep * j;
        const wRe = Math.cos(angle);
        const wIm = Math.sin(angle);

        const evenIdx = i + j;
        const oddIdx = i + j + halfSize;

        const evenRe = result[evenIdx].re;
        const evenIm = result[evenIdx].im;
        const oddRe = result[oddIdx].re;
        const oddIm = result[oddIdx].im;

        const tRe = wRe * oddRe - wIm * oddIm;
        const tIm = wRe * oddIm + wIm * oddRe;

        result[evenIdx] = { re: evenRe + tRe, im: evenIm + tIm };
        result[oddIdx] = { re: evenRe - tRe, im: evenIm - tIm };
      }
    }
  }

  return result;
};

const dftCore = (x: Complex[]): Complex[] => {
  const N = x.length;
  const result: Complex[] = [];

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

    result.push({ re, im });
  }

  return result;
};

/**
 * DFT with FFT optimization
 */
const dft = (x: Complex[]): FourierCoefficient[] => {
  const N = x.length;
  if (N === 0) return [];

  const USE_FFT_THRESHOLD = 64;
  let rawResult: Complex[];

  if (N >= USE_FFT_THRESHOLD && isPowerOf2(N)) {
    rawResult = fftCore(x);
  } else if (N >= USE_FFT_THRESHOLD) {
    const paddedSize = nextPowerOf2(N);
    const padded: Complex[] = [...x];

    for (let i = N; i < paddedSize; i++) {
      padded.push({ re: 0, im: 0 });
    }

    const fftResult = fftCore(padded);

    rawResult = [];
    for (let k = 0; k < N; k++) {
      const idx = (k * paddedSize) / N;
      const idxLow = Math.floor(idx);
      const idxHigh = Math.ceil(idx) % paddedSize;
      const frac = idx - idxLow;

      if (idxLow === idxHigh || frac === 0) {
        rawResult.push(fftResult[idxLow]);
      } else {
        rawResult.push({
          re: fftResult[idxLow].re * (1 - frac) + fftResult[idxHigh].re * frac,
          im: fftResult[idxLow].im * (1 - frac) + fftResult[idxHigh].im * frac,
        });
      }
    }
  } else {
    rawResult = dftCore(x);
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
