/**
 * Core Type Definitions
 * 基础数学和几何类型
 */

/**
 * Complex number representation
 */
export interface Complex {
  re: number;
  im: number;
}

/**
 * 2D Point representation
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Fourier coefficient with frequency, amplitude, and phase
 */
export interface FourierCoefficient {
  re: number;
  im: number;
  freq: number;
  amp: number;
  phase: number;
}

/**
 * Application mode for different input methods
 */
export enum AppMode {
  FUNCTION = 'FUNCTION',
  IMAGE_UPLOAD = 'IMAGE_UPLOAD',
  AI_GENERATE = 'AI_GENERATE',
}

/**
 * Available preset sample keys
 */
export type PresetSampleKey = 'PIKACHU' | 'DORAEMON';
