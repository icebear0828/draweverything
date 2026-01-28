/**
 * Fast Fourier Transform (FFT) Implementation
 *
 * High-level API for DFT computation with automatic algorithm selection:
 * - Small inputs (< FFT_THRESHOLD): Direct DFT
 * - Power of 2 sizes: Cooley-Tukey FFT
 * - Other sizes: Bluestein FFT (Chirp-Z Transform)
 */

import type { Complex, FourierCoefficient } from '../types';
import { FFT_THRESHOLD } from '../constants/config';
import { isPowerOf2, fftCore, dftCore, bluesteinFFT } from './fft-core';

/**
 * Compute DFT using FFT when possible
 * Returns sorted FourierCoefficients (by amplitude, descending)
 *
 * Algorithm selection:
 * - N < FFT_THRESHOLD: use direct DFT (small input, overhead not worth it)
 * - N is power of 2: use Cooley-Tukey FFT
 * - N is not power of 2: use Bluestein FFT (exact, O(N log N))
 */
export const dft = (x: Complex[]): FourierCoefficient[] => {
  const N = x.length;
  if (N === 0) return [];

  let rawResult: Complex[];

  if (N < FFT_THRESHOLD) {
    // Small input: use direct DFT
    rawResult = dftCore(x);
  } else if (isPowerOf2(N)) {
    // Power of 2: use Cooley-Tukey FFT
    rawResult = fftCore(x);
  } else {
    // Non-power-of-2: use Bluestein FFT for exact results
    rawResult = bluesteinFFT(x);
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

// Re-export core functions for advanced usage
export { isPowerOf2, fftCore, dftCore, bluesteinFFT } from './fft-core';
