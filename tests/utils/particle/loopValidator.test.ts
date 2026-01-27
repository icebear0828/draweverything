/**
 * Tests for Loop Validator
 */

import { describe, it, expect } from 'vitest';
import {
  validateLoopExpression,
  validateLoopBounds,
  calculateNestingDepth,
  estimateMaxIterations,
  getDefaultLoopConfig,
} from '@/utils/particle/loopValidator';
import { parseLoops } from '@/utils/particle/loopParser';

describe('validateLoopExpression', () => {
  it('should pass for expression without loops', () => {
    const result = validateLoopExpression('n * sin(t)');
    expect(result.valid).toBe(true);
  });

  it('should pass for valid sum loop', () => {
    const result = validateLoopExpression('sum(i, 0, 10, sin(i))');
    expect(result.valid).toBe(true);
  });

  it('should pass for valid prod loop', () => {
    const result = validateLoopExpression('prod(i, 1, 5, i)');
    expect(result.valid).toBe(true);
  });

  it('should pass for valid nested loops within depth limit', () => {
    const result = validateLoopExpression('sum(i, 0, 5, sum(j, 0, 5, i*j))');
    expect(result.valid).toBe(true);
  });

  it('should reject loops exceeding nesting depth', () => {
    // 4 levels deep (exceeds default max of 3)
    const expr = 'sum(a, 0, 5, sum(b, 0, 5, sum(c, 0, 5, sum(d, 0, 5, 1))))';
    const result = validateLoopExpression(expr);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('nesting depth');
  });

  it('should allow custom nesting depth limit', () => {
    const expr = 'sum(a, 0, 5, sum(b, 0, 5, sum(c, 0, 5, sum(d, 0, 5, 1))))';
    const result = validateLoopExpression(expr, [], { maxNestingDepth: 5 });
    expect(result.valid).toBe(true);
  });

  it('should reject iterator that conflicts with built-in variable', () => {
    const result = validateLoopExpression('sum(n, 0, 10, n)');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('conflicts with built-in');
  });

  it('should reject iterator that shadows outer iterator', () => {
    const result = validateLoopExpression('sum(i, 0, 5, sum(i, 0, 5, i))');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('shadows outer loop');
  });

  it('should warn when iterator shadows user variable', () => {
    const result = validateLoopExpression('sum(x, 0, 5, x)', ['x']);
    expect(result.valid).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings![0]).toContain('shadows a defined variable');
  });

  it('should validate loop body not exceeding max length', () => {
    const longBody = 'a'.repeat(600); // exceeds default 500 char limit
    const expr = `sum(i, 0, 5, ${longBody})`;
    const result = validateLoopExpression(expr);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('body length');
  });

  it('should accept external variables in loop', () => {
    const result = validateLoopExpression('sum(i, 0, n, i*t)', ['customVar']);
    expect(result.valid).toBe(true);
  });
});

describe('validateLoopBounds', () => {
  it('should pass for numeric bounds', () => {
    const parseResult = parseLoops('sum(i, 0, 10, i)');
    const loop = parseResult.loops[0];
    const result = validateLoopBounds(loop);
    expect(result.valid).toBe(true);
  });

  it('should pass for variable bounds', () => {
    const parseResult = parseLoops('sum(i, 0, n, i)');
    const loop = parseResult.loops[0];
    const result = validateLoopBounds(loop);
    expect(result.valid).toBe(true);
  });

  it('should pass for expression bounds', () => {
    const parseResult = parseLoops('sum(i, n-5, n+5, i)');
    const loop = parseResult.loops[0];
    const result = validateLoopBounds(loop);
    expect(result.valid).toBe(true);
  });

  it('should reject empty start', () => {
    // Create a mock loop with empty start
    const mockLoop = {
      type: 'sum' as const,
      iterator: 'i',
      start: '',
      end: '10',
      step: null,
      body: 'i',
      position: { start: 0, end: 20 },
    };
    const result = validateLoopBounds(mockLoop);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('start expression is empty');
  });

  it('should reject empty body', () => {
    const mockLoop = {
      type: 'sum' as const,
      iterator: 'i',
      start: '0',
      end: '10',
      step: null,
      body: '',
      position: { start: 0, end: 20 },
    };
    const result = validateLoopBounds(mockLoop);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('body is empty');
  });
});

describe('calculateNestingDepth', () => {
  it('should return 0 for expression without loops', () => {
    expect(calculateNestingDepth('n * sin(t)')).toBe(0);
  });

  it('should return 1 for single loop', () => {
    expect(calculateNestingDepth('sum(i, 0, 10, i)')).toBe(1);
  });

  it('should return 2 for nested loops', () => {
    expect(calculateNestingDepth('sum(i, 0, 5, sum(j, 0, 5, i*j))')).toBe(2);
  });

  it('should return 3 for triple nested loops', () => {
    const expr = 'sum(a, 0, 5, sum(b, 0, 5, sum(c, 0, 5, a*b*c)))';
    expect(calculateNestingDepth(expr)).toBe(3);
  });

  it('should handle multiple independent loops at same level', () => {
    const expr = 'sum(i, 0, 5, i) + sum(j, 0, 5, j)';
    expect(calculateNestingDepth(expr)).toBe(1);
  });
});

describe('estimateMaxIterations', () => {
  it('should return 0 for expression without loops', () => {
    expect(estimateMaxIterations('n * sin(t)')).toBe(0);
  });

  it('should estimate iterations for simple loop', () => {
    const iterations = estimateMaxIterations('sum(i, 0, 10, i)');
    expect(iterations).toBe(11); // 0..10 inclusive
  });

  it('should estimate iterations with step', () => {
    const iterations = estimateMaxIterations('sum(i, 0, 10, 2, i)');
    expect(iterations).toBe(6); // 0, 2, 4, 6, 8, 10
  });

  it('should estimate iterations for nested loops', () => {
    const iterations = estimateMaxIterations('sum(i, 0, 4, sum(j, 0, 4, 1))');
    expect(iterations).toBe(5 * 5); // 5 * 5 = 25
  });

  it('should return Infinity for variable bounds', () => {
    const iterations = estimateMaxIterations('sum(i, 0, n, i)');
    expect(iterations).toBe(Infinity);
  });
});

describe('getDefaultLoopConfig', () => {
  it('should return expected default values', () => {
    const config = getDefaultLoopConfig();
    expect(config.maxIterations).toBe(10000);
    expect(config.maxNestingDepth).toBe(3);
    expect(config.maxBodyLength).toBe(500);
    expect(config.maxTotalIterations).toBe(100000);
  });
});
