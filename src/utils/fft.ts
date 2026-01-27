/**
 * Fast Fourier Transform (FFT) Implementation
 *
 * Cooley-Tukey FFT algorithm - O(N log N) complexity
 * Falls back to DFT for non-power-of-2 sizes
 */

import { Complex, FourierCoefficient } from '../types';
import { FFT_THRESHOLD } from '../constants/config';

/**
 * Check if n is a power of 2
 */
const isPowerOf2 = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

/**
 * Maximum FFT size limit (2^20 = 1048576)
 * Prevents excessive memory usage and computation time
 */
const MAX_FFT_SIZE = 1048576;

/**
 * Get next power of 2 >= n, capped at MAX_FFT_SIZE
 */
const nextPowerOf2 = (n: number): number => {
  if (n <= 1) return 1;
  const result = Math.pow(2, Math.ceil(Math.log2(n)));
  if (result > MAX_FFT_SIZE) {
    console.warn(
      `[FFT] Requested size ${n} exceeds MAX_FFT_SIZE (${MAX_FFT_SIZE}). Clamping to ${MAX_FFT_SIZE}.`
    );
    return MAX_FFT_SIZE;
  }
  return result;
};

/**
 * In-place bit-reversal permutation
 */
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
      // Swap
      const temp = arr[i];
      arr[i] = arr[reversed];
      arr[reversed] = temp;
    }
  }
};

/**
 * Cooley-Tukey FFT (iterative, in-place)
 */
const fftCore = (x: Complex[]): Complex[] => {
  const n = x.length;

  // Copy input
  const result: Complex[] = x.map(c => ({ re: c.re, im: c.im }));

  // Bit-reversal permutation
  bitReverse(result, n);

  // Cooley-Tukey iterative FFT
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

        // Twiddle factor multiplication: w * odd
        const tRe = wRe * oddRe - wIm * oddIm;
        const tIm = wRe * oddIm + wIm * oddRe;

        // Butterfly
        result[evenIdx] = { re: evenRe + tRe, im: evenIm + tIm };
        result[oddIdx] = { re: evenRe - tRe, im: evenIm - tIm };
      }
    }
  }

  return result;
};

/**
 * Standard DFT for non-power-of-2 sizes or small inputs
 */
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
 * Compute DFT using FFT when possible
 * Returns sorted FourierCoefficients (by amplitude, descending)
 */
export const dft = (x: Complex[]): FourierCoefficient[] => {
  const N = x.length;
  if (N === 0) return [];

  // Use DFT for small inputs (overhead of FFT not worth it)
  let rawResult: Complex[];

  if (N >= FFT_THRESHOLD && isPowerOf2(N)) {
    // Direct FFT
    rawResult = fftCore(x);
  } else if (N >= FFT_THRESHOLD) {
    // Pad to power of 2 for FFT, then truncate
    const paddedSize = nextPowerOf2(N);
    const padded: Complex[] = [...x];

    // Zero-padding
    for (let i = N; i < paddedSize; i++) {
      padded.push({ re: 0, im: 0 });
    }

    const fftResult = fftCore(padded);

    // Resample back to original size using linear interpolation
    rawResult = [];
    for (let k = 0; k < N; k++) {
      const idx = (k * paddedSize) / N;
      const idxLow = Math.floor(idx);
      const idxHigh = Math.ceil(idx) % paddedSize;
      const frac = idx - idxLow;

      if (idxLow === idxHigh || frac === 0) {
        rawResult.push(fftResult[idxLow]);
      } else {
        // Linear interpolation
        rawResult.push({
          re: fftResult[idxLow].re * (1 - frac) + fftResult[idxHigh].re * frac,
          im: fftResult[idxLow].im * (1 - frac) + fftResult[idxHigh].im * frac,
        });
      }
    }
  } else {
    // Use standard DFT for small inputs
    rawResult = dftCore(x);
  }

  // Convert to FourierCoefficients
  const coefficients: FourierCoefficient[] = rawResult.map((c, k) => {
    const re = c.re / N;
    const im = c.im / N;
    const freq = k > N / 2 ? k - N : k;
    const amp = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);

    return { re, im, freq, amp, phase };
  });

  // Sort by amplitude (descending) for better visualization
  return coefficients.sort((a, b) => b.amp - a.amp);
};

/**
 * Legacy export for backward compatibility
 */
export { dft as fastDFT };
