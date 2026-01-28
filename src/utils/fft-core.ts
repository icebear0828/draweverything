/**
 * FFT Core Algorithms
 *
 * 纯算法实现，无外部依赖，可在主线程和 Worker 中共享使用
 */

import type { Complex } from '../types';

/**
 * Check if n is a power of 2
 */
export const isPowerOf2 = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

/**
 * Maximum FFT size limit (2^20 = 1048576)
 */
export const MAX_FFT_SIZE = 1048576;

/**
 * Get next power of 2 >= n, capped at MAX_FFT_SIZE
 */
export const nextPowerOf2 = (n: number): number => {
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
export const bitReverse = (arr: Complex[], n: number): void => {
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

/**
 * Cooley-Tukey FFT (iterative, in-place)
 * Requires input length to be a power of 2
 */
export const fftCore = (x: Complex[]): Complex[] => {
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
 * Standard DFT for small inputs
 * O(N²) but accurate for any size
 */
export const dftCore = (x: Complex[]): Complex[] => {
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
 * Bluestein FFT (Chirp-Z Transform)
 * Computes exact DFT for any size N in O(N log N) time
 */
export const bluesteinFFT = (x: Complex[]): Complex[] => {
  const N = x.length;

  // Find M = smallest power of 2 >= 2N - 1
  const M = nextPowerOf2(2 * N - 1);

  // Precompute chirp factors: W_N^(n²/2)
  const chirp: Complex[] = new Array(N);
  for (let n = 0; n < N; n++) {
    const angle = Math.PI * n * n / N;
    chirp[n] = { re: Math.cos(angle), im: Math.sin(angle) };
  }

  // Build a[n] = x[n] * conj(chirp[n])
  const a: Complex[] = new Array(M).fill(null).map(() => ({ re: 0, im: 0 }));
  for (let n = 0; n < N; n++) {
    a[n] = {
      re: x[n].re * chirp[n].re + x[n].im * chirp[n].im,
      im: x[n].im * chirp[n].re - x[n].re * chirp[n].im,
    };
  }

  // Build b[n] = chirp sequence (with wrap-around for convolution)
  const b: Complex[] = new Array(M).fill(null).map(() => ({ re: 0, im: 0 }));
  b[0] = chirp[0];
  for (let n = 1; n < N; n++) {
    b[n] = chirp[n];
    b[M - n] = chirp[n];
  }

  // Compute FFT of a and b
  const A = fftCore(a);
  const B = fftCore(b);

  // Pointwise multiply A * B
  const C: Complex[] = new Array(M);
  for (let k = 0; k < M; k++) {
    C[k] = {
      re: A[k].re * B[k].re - A[k].im * B[k].im,
      im: A[k].re * B[k].im + A[k].im * B[k].re,
    };
  }

  // Inverse FFT (conjugate, FFT, conjugate, scale)
  for (let k = 0; k < M; k++) {
    C[k].im = -C[k].im;
  }
  const c = fftCore(C);
  for (let k = 0; k < M; k++) {
    c[k].re /= M;
    c[k].im = -c[k].im / M;
  }

  // Extract result: X[k] = conj(chirp[k]) * c[k]
  const result: Complex[] = new Array(N);
  for (let k = 0; k < N; k++) {
    result[k] = {
      re: c[k].re * chirp[k].re + c[k].im * chirp[k].im,
      im: c[k].im * chirp[k].re - c[k].re * chirp[k].im,
    };
  }

  return result;
};
