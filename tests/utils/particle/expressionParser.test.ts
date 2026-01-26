/**
 * Tests for Expression Parser
 */

import { describe, it, expect } from 'vitest';
import {
    tokenize,
    extractVariables,
    buildDependencyGraph,
    validateOutput
} from '../../../utils/particle/expressionParser';
import { ParticleExpressionError } from '../../../types/particle';

describe('tokenize', () => {
    it('should tokenize simple expression', () => {
        const tokens = tokenize('n + t');
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toEqual({ type: 'IDENTIFIER', value: 'n', position: 0 });
        expect(tokens[1]).toEqual({ type: 'OPERATOR', value: '+', position: 2 });
        expect(tokens[2]).toEqual({ type: 'IDENTIFIER', value: 't', position: 4 });
    });

    it('should tokenize Math methods', () => {
        const tokens = tokenize('Math.sin(t)');
        expect(tokens).toHaveLength(6); // Math, ., sin, (, t, )
        expect(tokens[0].value).toBe('Math');
        expect(tokens[1].value).toBe('.');
        expect(tokens[2].value).toBe('sin');
        expect(tokens[3].value).toBe('(');
        expect(tokens[4].value).toBe('t');
        expect(tokens[5].value).toBe(')');
    });

    it('should tokenize numbers with decimals', () => {
        const tokens = tokenize('0.1 * n');
        expect(tokens[0]).toEqual({ type: 'NUMBER', value: '0.1', position: 0 });
    });

    it('should tokenize complex expression', () => {
        const tokens = tokenize('Math.pow(n, 1.5) / (n + 1000)');
        expect(tokens.length).toBeGreaterThan(0);
        expect(tokens.some(t => t.value === 'pow')).toBe(true);
        expect(tokens.some(t => t.value === '1.5')).toBe(true);
    });
});

describe('extractVariables', () => {
    it('should extract user-defined variables', () => {
        const vars = extractVariables('r_base * (1 + 0.3 * wave)');
        expect(vars).toEqual(new Set(['r_base', 'wave']));
    });

    it('should not extract builtin variables n and t', () => {
        const vars = extractVariables('n * t + r');
        expect(vars).toEqual(new Set(['r']));
    });

    it('should not extract Math methods', () => {
        const vars = extractVariables('Math.sin(theta) + Math.cos(theta)');
        expect(vars).toEqual(new Set(['theta']));
    });

    it('should handle complex expressions', () => {
        const vars = extractVariables('r * Math.cos(theta) + offset_x');
        expect(vars).toEqual(new Set(['r', 'theta', 'offset_x']));
    });

    it('should return empty set for expression with only builtins', () => {
        const vars = extractVariables('Math.sin(n * t)');
        expect(vars.size).toBe(0);
    });
});

describe('buildDependencyGraph', () => {
    it('should build correct dependency order', () => {
        const definitions = {
            r_base: 'Math.pow(n, 1.5) / (n + 1000)',
            wave: 'Math.sin(0.1 * n * Math.sin(83.333 * t))',
            r: 'r_base * (1 + 0.3 * wave)',
            theta: '0.1 * n * t'
        };

        const graph = buildDependencyGraph(definitions);

        expect(graph.hasCycle).toBe(false);

        // r depends on r_base and wave, so they must come first
        const rIndex = graph.sortedOrder.indexOf('r');
        const rBaseIndex = graph.sortedOrder.indexOf('r_base');
        const waveIndex = graph.sortedOrder.indexOf('wave');

        expect(rBaseIndex).toBeLessThan(rIndex);
        expect(waveIndex).toBeLessThan(rIndex);
    });

    it('should detect circular dependencies', () => {
        const definitions = {
            a: 'b + 1',
            b: 'c + 1',
            c: 'a + 1'  // cycle!
        };

        const graph = buildDependencyGraph(definitions);
        expect(graph.hasCycle).toBe(true);
        expect(graph.cycleInfo).toContain('a');
    });

    it('should throw on undefined variable', () => {
        const definitions = {
            r: 'undefined_var * 2'
        };

        expect(() => buildDependencyGraph(definitions)).toThrow(ParticleExpressionError);
    });

    it('should handle independent variables', () => {
        const definitions = {
            a: 'n * 2',
            b: 't * 3',
            c: 'n + t'
        };

        const graph = buildDependencyGraph(definitions);
        expect(graph.hasCycle).toBe(false);
        expect(graph.sortedOrder).toHaveLength(3);
    });
});

describe('validateOutput', () => {
    it('should pass for valid output', () => {
        const definitions = { r: 'n', theta: 't' };
        const output = { x: 'r * Math.cos(theta)', y: 'r * Math.sin(theta)' };

        expect(() => validateOutput(output, definitions)).not.toThrow();
    });

    it('should throw for undefined variable in output', () => {
        const definitions = { r: 'n' };
        const output = { x: 'r * Math.cos(theta)', y: 'r' }; // theta not defined

        expect(() => validateOutput(output, definitions)).toThrow(ParticleExpressionError);
    });

    it('should handle optional outputs', () => {
        const definitions = { r: 'n' };
        const output = { x: 'r', y: 'r', alpha: undefined };

        expect(() => validateOutput(output, definitions)).not.toThrow();
    });
});
