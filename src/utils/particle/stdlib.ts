/**
 * Particle Expression Standard Library
 * 
 * Built-in functions available in particle expressions
 */

import { ParticlePreset, ParticleExpressionSystem } from '../../types/particle';

// ============================================
// Noise Functions
// ============================================

/**
 * Simple deterministic pseudo-random based on input
 */
export function hash(x: number): number {
    const s = Math.sin(x * 12.9898) * 43758.5453;
    return s - Math.floor(s);
}

/**
 * Simple 1D noise
 */
export function noise1d(x: number): number {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f); // smoothstep
    return hash(i) * (1 - u) + hash(i + 1) * u;
}

/**
 * 2D noise using bilinear interpolation
 */
export function noise2d(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const n00 = hash(ix + iy * 57);
    const n10 = hash(ix + 1 + iy * 57);
    const n01 = hash(ix + (iy + 1) * 57);
    const n11 = hash(ix + 1 + (iy + 1) * 57);

    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);

    return (n00 * (1 - u) + n10 * u) * (1 - v) +
        (n01 * (1 - u) + n11 * u) * v;
}

// ============================================
// Shape Functions
// ============================================

/**
 * Multi-arm spiral
 */
export function spiral(n: number, t: number, arms: number): number {
    return (n * 0.1 + t) * arms;
}

/**
 * Rose curve (flower petals)
 */
export function rose(n: number, t: number, petals: number): number {
    const theta = n * 0.01 + t;
    return Math.cos(petals * theta);
}

/**
 * Lissajous curve parameter
 */
export function lissajous(t: number, a: number, b: number, delta: number): [number, number] {
    return [
        Math.sin(a * t + delta),
        Math.sin(b * t)
    ];
}

// ============================================
// Easing Functions
// ============================================

/**
 * Smoothstep easing
 */
export function smoothstep(x: number): number {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
}

/**
 * Elastic easing
 */
export function elastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 :
        Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

/**
 * Bounce easing
 */
export function bounce(x: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

// ============================================
// Color Functions  
// ============================================

/**
 * HSL to Hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Rainbow color based on position (0-1)
 */
export function rainbow(t: number): string {
    return hslToHex(t * 360, 0.8, 0.5);
}

// ============================================
// Stdlib Registration for Expression Compiler
// ============================================

/**
 * Standard library functions available in expressions
 * These are injected into the execution context
 */
export const STDLIB_FUNCTIONS = {
    // Noise
    hash,
    noise1d,
    noise2d,

    // Shapes
    spiral,
    rose,

    // Easing
    smoothstep,
    elastic,
    bounce,

    // Colors
    hslToHex,
    rainbow
};

// ============================================
// Preset Inheritance
// ============================================

// Preset registry for inheritance
const presetRegistry = new Map<string, ParticlePreset>();

/**
 * Register a preset for inheritance
 */
export function registerPreset(key: string, preset: ParticlePreset): void {
    presetRegistry.set(key, preset);
}

/**
 * Resolve inheritance and return complete preset
 */
export function resolvePresetInheritance(preset: ParticlePreset): ParticlePreset {
    if (!preset.extends) {
        return preset;
    }

    const parent = presetRegistry.get(preset.extends);
    if (!parent) {
        console.warn(`Parent preset "${preset.extends}" not found, using child as-is`);
        return preset;
    }

    // Recursively resolve parent
    const resolvedParent = resolvePresetInheritance(parent);

    // Merge: child overrides parent
    return mergePresets(resolvedParent, preset);
}

/**
 * Deep merge two presets (child overrides parent)
 */
function mergePresets(parent: ParticlePreset, child: ParticlePreset): ParticlePreset {
    const mergedSystems: ParticleExpressionSystem[] = [];

    // If child has systems, use those; otherwise inherit from parent
    if (child.systems && child.systems.length > 0) {
        // Merge systems by index
        for (let i = 0; i < Math.max(parent.systems.length, child.systems.length); i++) {
            if (i < child.systems.length && i < parent.systems.length) {
                // Merge this system
                mergedSystems.push(mergeSystem(parent.systems[i], child.systems[i]));
            } else if (i < child.systems.length) {
                mergedSystems.push(child.systems[i]);
            } else {
                mergedSystems.push(parent.systems[i]);
            }
        }
    } else {
        mergedSystems.push(...parent.systems);
    }

    return {
        label: child.label,
        systems: mergedSystems,
        blendMode: child.blendMode ?? parent.blendMode,
        backgroundColor: child.backgroundColor ?? parent.backgroundColor
    };
}

/**
 * Merge two particle expression systems
 */
function mergeSystem(
    parent: ParticleExpressionSystem,
    child: ParticleExpressionSystem
): ParticleExpressionSystem {
    return {
        definitions: {
            ...parent.definitions,
            ...child.definitions
        },
        output: {
            ...parent.output,
            ...child.output
        },
        particleCount: child.particleCount ?? parent.particleCount,
        timeScale: child.timeScale ?? parent.timeScale,
        colorHex: child.colorHex ?? parent.colorHex
    };
}
