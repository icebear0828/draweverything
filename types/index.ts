/**
 * Type Definitions Index
 * 统一类型导出
 */

// Core types
export type { Complex, Point, FourierCoefficient } from './core';
export { AppMode } from './core';

// Layer types
export type { MathLayer, ProcessedLayer } from './layer';

// Preset types
export type { ParticleFormula, PresetDef } from './preset';

// Particle expression types (advanced)
export type {
  ParticleOutput,
  ParticleExpressionSystem,
  ParticlePreset,
  CompiledParticleOutput,
  CompiledVariable,
  CompiledParticleSystem,
  CompiledParticlePreset,
  DependencyNode,
  DependencyGraph,
} from './particle';

export { ParticleExpressionError } from './particle';
