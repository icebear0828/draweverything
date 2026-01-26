/**
 * Preset Type Definitions
 * 预设和粒子系统类型
 */

import { MathLayer } from './layer';

/**
 * 粒子系统公式配置
 */
export interface ParticleFormula {
  // 半径公式: r(n, t) - n 是粒子索引, t 是时间
  radiusFn: string;
  // 角度公式: θ(n, t)
  thetaFn: string;
  // 可选：半径调制因子
  radiusModFn?: string;
  // 可选：透明度公式 (0-1)
  alphaFn?: string;
  // 粒子数量 (默认 4000)
  particleCount?: number;
  // 颜色 (默认 #ffffff)
  colorHex?: string;
  // 时间步进缩放 (默认 0.0002)
  timeScale?: number;
}

/**
 * Preset definition
 * 预设定义
 */
export interface PresetDef {
  label: string;
  xFn?: string;
  yFn?: string;
  layers?: MathLayer[];
  tMin: number;
  tMax: number;
  scale: number;
  renderer?: 'FOURIER' | 'PARTICLE';
  particle?: ParticleFormula; // 粒子公式配置
}
