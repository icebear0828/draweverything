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

// Legacy format conversion
import type { ParticleFormula } from '../../types/preset';
import type { ParticleExpressionSystem } from '../../types/particle';

/**
 * Calculate optimal particle count based on device performance
 * Currently disabled to ensure full circle coverage for theta-based formulas
 */
export function getOptimalParticleCount(baseCount: number = 4000): number {
    // Disabled: particle reduction breaks theta coverage for circular effects
    // TODO: Consider dynamic theta coefficient adjustment instead
    return baseCount;
}

/**
 * Convert legacy ParticleFormula (polar) to ParticleExpressionSystem (cartesian)
 *
 * Legacy format uses polar coordinates (r, theta) with optional modulation.
 * New format uses explicit variable definitions and cartesian output.
 */
export function convertLegacyFormula(formula: ParticleFormula): ParticleExpressionSystem {
    const definitions: Record<string, string> = {
        r_base: formula.radiusFn,
        theta: formula.thetaFn,
    };

    // Add radius modulation if present
    if (formula.radiusModFn) {
        definitions.r_mod = formula.radiusModFn;
        definitions.r = 'r_base * r_mod';
    } else {
        definitions.r = 'r_base';
    }

    const baseCount = formula.particleCount ?? 4000;

    return {
        definitions,
        output: {
            x: 'r * Math.cos(theta)',
            y: 'r * Math.sin(theta)',
            alpha: formula.alphaFn ?? '1',
        },
        particleCount: getOptimalParticleCount(baseCount),
        timeScale: formula.timeScale ?? 0.0002,
        colorHex: formula.colorHex ?? '#ffffff',
    };
}
