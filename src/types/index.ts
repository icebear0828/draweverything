/**
 * Type Definitions Index
 * 统一类型导出
 */

// Core types
export type { Complex, Point, FourierCoefficient, PresetSampleKey } from './core';
export { AppMode } from './core';

// Layer types
export type { MathLayer, ProcessedLayer } from './layer';

// Preset types
export type { ParticleFormula, PresetDef } from './preset';

// Store types
export type {
  UIState,
  UIActions,
  UIStore,
  SimulationState,
  SimulationActions,
  SimulationStore,
  ConfigState,
  ConfigActions,
  ConfigStore,
  DataState,
  DataActions,
  DataStore,
  LayerState,
  LayerActions,
  LayerStore,
  AppStore,
} from './stores';

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
