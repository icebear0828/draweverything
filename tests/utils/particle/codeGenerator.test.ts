/**
 * Tests for Code Generator
 */

import { describe, it, expect } from 'vitest';
import {
    compileParticleExpressionSystem,
    executeParticle
} from '../../../utils/particle/codeGenerator';
import { ParticleExpressionSystem, ParticleExpressionError } from '../../../types/particle';

describe('compileParticleExpressionSystem', () => {
    it('should compile spiral galaxy formula', () => {
        const system: ParticleExpressionSystem = {
            definitions: {
                r_base: 'Math.pow(n, 1.5) / (n + 1000)',
                wave: 'Math.sin(0.1 * n * Math.sin(83.333 * t))',
                r: 'r_base * (1 + 0.3 * wave)',
                theta: '0.1 * n * t'
            },
            output: {
                x: 'r * Math.cos(theta)',
                y: 'r * Math.sin(theta)',
                alpha: '0.3 + 0.7 * Math.abs(wave)'
            },
            particleCount: 1000,
            timeScale: 0.0002
        };

        const compiled = compileParticleExpressionSystem(system);

        expect(compiled.variables).toHaveLength(4);
        expect(compiled.particleCount).toBe(1000);
        expect(compiled.timeScale).toBe(0.0002);
    });

    it('should execute particle correctly', () => {
        const system: ParticleExpressionSystem = {
            definitions: {
                r: 'n * 0.1',
                theta: 't'
            },
            output: {
                x: 'r * Math.cos(theta)',
                y: 'r * Math.sin(theta)'
            }
        };

        const compiled = compileParticleExpressionSystem(system);
        const result = executeParticle(compiled, 10, 0); // n=10, t=0

        // r = 10 * 0.1 = 1
        // x = 1 * cos(0) = 1
        // y = 1 * sin(0) = 0
        expect(result.x).toBeCloseTo(1, 5);
        expect(result.y).toBeCloseTo(0, 5);
    });

    it('should handle alpha output', () => {
        const system: ParticleExpressionSystem = {
            definitions: {
                pulse: 'Math.sin(t)'
            },
            output: {
                x: 'n',
                y: 'n',
                alpha: '0.5 + 0.5 * pulse'
            }
        };

        const compiled = compileParticleExpressionSystem(system);

        // At t = PI/2, sin(t) = 1, alpha = 1
        const result = executeParticle(compiled, 1, Math.PI / 2);
        expect(result.alpha).toBeCloseTo(1, 5);
    });

    it('should throw on circular dependency', () => {
        const system: ParticleExpressionSystem = {
            definitions: {
                a: 'b + 1',
                b: 'a + 1'
            },
            output: { x: 'a', y: 'b' }
        };

        expect(() => compileParticleExpressionSystem(system)).toThrow(ParticleExpressionError);
    });

    it('should throw on undefined variable in output', () => {
        const system: ParticleExpressionSystem = {
            definitions: {
                r: 'n'
            },
            output: { x: 'r', y: 'undefined_var' }
        };

        expect(() => compileParticleExpressionSystem(system)).toThrow(ParticleExpressionError);
    });

    it('should use default values for optional fields', () => {
        const system: ParticleExpressionSystem = {
            definitions: {},
            output: { x: 'n', y: 't' }
        };

        const compiled = compileParticleExpressionSystem(system);

        expect(compiled.particleCount).toBe(4000);
        expect(compiled.timeScale).toBe(0.0002);
        expect(compiled.colorHex).toBe('#ffffff');
    });

    it('should cache compilation results', () => {
        const system: ParticleExpressionSystem = {
            definitions: { r: 'n' },
            output: { x: 'r', y: 'r' }
        };

        const compiled1 = compileParticleExpressionSystem(system);
        const compiled2 = compileParticleExpressionSystem(system);

        expect(compiled1).toBe(compiled2); // Same reference
    });
});

describe('executeParticle', () => {
    it('should compute variables in correct order', () => {
        const system: ParticleExpressionSystem = {
            definitions: {
                a: 'n',
                b: 'a * 2',  // depends on a
                c: 'b * 3'   // depends on b
            },
            output: { x: 'c', y: 'c' }
        };

        const compiled = compileParticleExpressionSystem(system);
        const result = executeParticle(compiled, 10, 0);

        // a = 10, b = 20, c = 60
        expect(result.x).toBe(60);
        expect(result.y).toBe(60);
    });

    it('should handle Math functions correctly', () => {
        const system: ParticleExpressionSystem = {
            definitions: {
                val: 'Math.sqrt(n)'
            },
            output: { x: 'val', y: 'Math.pow(val, 2)' }
        };

        const compiled = compileParticleExpressionSystem(system);
        const result = executeParticle(compiled, 16, 0);

        expect(result.x).toBe(4);  // sqrt(16)
        expect(result.y).toBe(16); // 4^2
    });
});
