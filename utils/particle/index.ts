/**
 * Particle Expression System
 * 
 * Main entry point for the particle expression compiler
 */

export * from './expressionParser';
export * from './codeGenerator';

// Re-export types
export type {
    ParticleExpressionSystem,
    ParticlePreset,
    CompiledParticleSystem,
    CompiledParticlePreset,
    ParticleOutput,
    DependencyGraph
} from '../../types/particle';

export { ParticleExpressionError } from '../../types/particle';
