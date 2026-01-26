import { ParticleFormula } from '../types';

/**
 * Compiled particle formula with executable functions
 */
export interface CompiledParticleFormula {
    radiusFn: (n: number, t: number) => number;
    thetaFn: (n: number, t: number) => number;
    radiusModFn: (n: number, t: number) => number;
    alphaFn: (n: number, t: number, rMod: number) => number;
    particleCount: number;
    colorHex: string;
    timeScale: number;
}

/**
 * Default formula (螺旋星系 / Spiral Galaxy)
 */
export const DEFAULT_PARTICLE_FORMULA: ParticleFormula = {
    radiusFn: 'Math.pow(n, 1.5) / (n + 1000)',
    thetaFn: '0.1 * n * t',
    radiusModFn: '1 + 0.3 * Math.sin(0.1 * n * Math.sin(83.333 * t))',
    alphaFn: '0.3 + 0.7 * Math.abs(Math.sin(0.1 * n * Math.sin(83.333 * t)))',
    particleCount: 4000,
    colorHex: '#ffffff',
    timeScale: 0.0002
};

/**
 * Safely compile a formula string into a function
 */
function compileFormula<T extends (...args: number[]) => number>(
    formulaStr: string,
    argNames: string[],
    fallback: T
): T {
    if (!formulaStr || formulaStr.trim() === '') {
        return fallback;
    }

    try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(...argNames, `return ${formulaStr};`) as T;

        // Test the function with sample values to ensure it works
        const testArgs = argNames.map(() => 1);
        const result = fn(...testArgs);

        if (typeof result !== 'number' || isNaN(result)) {
            console.warn(`Formula "${formulaStr}" returned invalid result, using fallback`);
            return fallback;
        }

        return fn;
    } catch (e) {
        console.warn(`Failed to compile formula "${formulaStr}":`, e);
        return fallback;
    }
}

/**
 * Compile a ParticleFormula configuration into executable functions
 */
export function compileParticleFormula(formula?: ParticleFormula): CompiledParticleFormula {
    const f = formula ?? DEFAULT_PARTICLE_FORMULA;

    return {
        radiusFn: compileFormula(
            f.radiusFn,
            ['n', 't'],
            (n: number, _t: number) => Math.pow(n, 1.5) / (n + 1000)
        ),

        thetaFn: compileFormula(
            f.thetaFn,
            ['n', 't'],
            (n: number, t: number) => 0.1 * n * t
        ),

        radiusModFn: compileFormula(
            f.radiusModFn ?? '1',
            ['n', 't'],
            (_n: number, _t: number) => 1
        ),

        alphaFn: compileFormula(
            f.alphaFn ?? '1',
            ['n', 't', 'rMod'],
            (_n: number, _t: number, _rMod: number) => 1
        ),

        particleCount: f.particleCount ?? 4000,
        colorHex: f.colorHex ?? '#ffffff',
        timeScale: f.timeScale ?? 0.0002
    };
}

/**
 * Pre-defined particle formula presets
 */
export const PARTICLE_FORMULAS: Record<string, ParticleFormula> = {
    SPIRAL_GALAXY: DEFAULT_PARTICLE_FORMULA,

    VORTEX: {
        radiusFn: 'n * 0.02',
        thetaFn: 'n * 0.1 + t * 2',
        radiusModFn: '1 + 0.5 * Math.sin(t * 5)',
        alphaFn: '0.8',
        particleCount: 3000,
        colorHex: '#22d3ee',
        timeScale: 0.001
    },

    NEBULA: {
        radiusFn: 'Math.sqrt(n) * 2',
        thetaFn: 'n * 0.05 + Math.sin(t) * 0.5',
        radiusModFn: '1 + 0.2 * Math.sin(n * 0.01 + t * 3)',
        alphaFn: '0.2 + 0.5 * Math.abs(Math.sin(n * 0.005))',
        particleCount: 5000,
        colorHex: '#a855f7',
        timeScale: 0.0003
    },

    FLOWER: {
        radiusFn: '10 + 5 * Math.cos(5 * n * 0.01)',
        thetaFn: 'n * 0.01 + t',
        radiusModFn: '1',
        alphaFn: '0.6 + 0.4 * Math.abs(Math.cos(n * 0.02))',
        particleCount: 2000,
        colorHex: '#f472b6',
        timeScale: 0.0005
    }
};
