/**
 * Tests for Particle Standard Library
 */

import { describe, it, expect } from 'vitest';
import {
    hash,
    noise1d,
    noise2d,
    spiral,
    rose,
    smoothstep,
    elastic,
    bounce,
    hslToHex,
    rainbow,
    registerPreset,
    resolvePresetInheritance
} from '../../../utils/particle/stdlib';
import { ParticlePreset } from '../../../types/particle';

describe('noise functions', () => {
    it('hash should return values between 0 and 1', () => {
        for (let i = 0; i < 100; i++) {
            const h = hash(i);
            expect(h).toBeGreaterThanOrEqual(0);
            expect(h).toBeLessThanOrEqual(1);
        }
    });

    it('hash should be deterministic', () => {
        expect(hash(42)).toBe(hash(42));
        expect(hash(123)).toBe(hash(123));
    });

    it('noise1d should return smooth values', () => {
        const v1 = noise1d(0.5);
        const v2 = noise1d(0.51);
        // Values should be close
        expect(Math.abs(v1 - v2)).toBeLessThan(0.1);
    });

    it('noise2d should return values between 0 and 1', () => {
        for (let i = 0; i < 10; i++) {
            const n = noise2d(i * 0.1, i * 0.2);
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThanOrEqual(1);
        }
    });
});

describe('shape functions', () => {
    it('spiral should increase with n', () => {
        const v1 = spiral(10, 0, 1);
        const v2 = spiral(20, 0, 1);
        expect(v2).toBeGreaterThan(v1);
    });

    it('rose should return values between -1 and 1', () => {
        for (let i = 0; i < 100; i++) {
            const r = rose(i, 0, 5);
            expect(r).toBeGreaterThanOrEqual(-1);
            expect(r).toBeLessThanOrEqual(1);
        }
    });
});

describe('easing functions', () => {
    it('smoothstep should clamp to 0-1', () => {
        expect(smoothstep(-1)).toBe(0);
        expect(smoothstep(2)).toBe(1);
        expect(smoothstep(0.5)).toBeCloseTo(0.5, 1);
    });

    it('elastic should return 0 at 0 and 1 at 1', () => {
        expect(elastic(0)).toBe(0);
        expect(elastic(1)).toBe(1);
    });

    it('bounce should return 0 at 0 and 1 at 1', () => {
        expect(bounce(0)).toBe(0);
        expect(bounce(1)).toBe(1);
    });
});

describe('color functions', () => {
    it('hslToHex should return valid hex colors', () => {
        const red = hslToHex(0, 1, 0.5);
        expect(red).toMatch(/^#[0-9a-f]{6}$/);
        expect(red).toBe('#ff0000');
    });

    it('rainbow should return different colors for different t', () => {
        const c1 = rainbow(0);
        const c2 = rainbow(0.5);
        expect(c1).not.toBe(c2);
        expect(c1).toMatch(/^#[0-9a-f]{6}$/);
    });
});

describe('preset inheritance', () => {
    it('should resolve simple inheritance', () => {
        const parent: ParticlePreset = {
            label: 'Parent',
            systems: [{
                definitions: { r: 'n', theta: 't' },
                output: { x: 'r', y: 'r' },
                particleCount: 1000
            }],
            blendMode: 'normal'
        };

        const child: ParticlePreset = {
            label: 'Child',
            extends: 'parent',
            systems: [{
                definitions: { theta: '2 * t' }, // Override theta
                output: { x: 'r', y: 'r' }
            }]
        };

        registerPreset('parent', parent);
        const resolved = resolvePresetInheritance(child);

        expect(resolved.label).toBe('Child');
        expect(resolved.systems[0].definitions.r).toBe('n'); // Inherited
        expect(resolved.systems[0].definitions.theta).toBe('2 * t'); // Overridden
        expect(resolved.blendMode).toBe('normal'); // Inherited
    });

    it('should handle missing parent gracefully', () => {
        const child: ParticlePreset = {
            label: 'Orphan',
            extends: 'nonexistent',
            systems: [{ definitions: {}, output: { x: 'n', y: 't' } }]
        };

        const resolved = resolvePresetInheritance(child);
        expect(resolved.label).toBe('Orphan');
    });

    it('should handle preset without inheritance', () => {
        const preset: ParticlePreset = {
            label: 'Standalone',
            systems: [{ definitions: {}, output: { x: 'n', y: 't' } }]
        };

        const resolved = resolvePresetInheritance(preset);
        expect(resolved).toBe(preset);
    });
});
