/**
 * Layer Type Definitions
 * 图层配置和处理后的图层类型
 */

import { FourierCoefficient } from './core';

/**
 * User Configuration (Input)
 * 用户配置的数学图层
 */
export interface MathLayer {
  xFn: string; // Used for x(t) OR r(t)
  yFn: string; // Used for y(t) OR theta(t)
  isPolar?: boolean; // Toggle between Cartesian and Polar
  colorHex: string;
  scaleMod?: number; // Modify global scale for this layer
  opacity?: number; // 0.0 to 1.0
  lineWidth?: number; // for emphasis
  fillColor?: string; // Hex color for filling
  ampModFn?: string; // String function to modulate amplitude
}

/**
 * Processed Data (Ready for Renderer)
 * 处理后的图层数据，准备用于渲染
 */
export interface ProcessedLayer {
  id: string; // Unique identifier for React keys
  coefficients: FourierCoefficient[];
  color: string;
  fillColor?: string;
  opacity: number;
  lineWidth: number;
  modFn: (t: number) => number; // Compiled function
}
