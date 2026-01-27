/**
 * Tests for Loop Compiler
 */

import { describe, it, expect } from 'vitest';
import {
  compileLoopExpression,
  compileExpressionWithLoops,
} from '@/utils/particle/loopCompiler';
import { ParticleExpressionError } from '@/types/particle';

describe('compileLoopExpression', () => {
  it('should compile simple sum', () => {
    const { executor } = compileLoopExpression('sum(i, 1, 5, i)', []);
    const result = executor(0, 0, {});
    expect(result).toBe(15); // 1+2+3+4+5
  });

  it('should compile simple prod (factorial)', () => {
    const { executor } = compileLoopExpression('prod(i, 1, 5, i)', []);
    const result = executor(0, 0, {});
    expect(result).toBe(120); // 5!
  });

  it('should compile sum with step', () => {
    const { executor } = compileLoopExpression('sum(i, 0, 10, 2, i)', []);
    const result = executor(0, 0, {});
    expect(result).toBe(30); // 0+2+4+6+8+10
  });

  it('should access n variable', () => {
    const { executor } = compileLoopExpression('sum(i, 1, n, i)', ['n']);
    const result = executor(3, 0, {}); // n=3
    expect(result).toBe(6); // 1+2+3
  });

  it('should access t variable', () => {
    const { executor } = compileLoopExpression('sum(i, 0, 2, t)', []);
    const result = executor(0, 5, {}); // t=5
    expect(result).toBe(15); // 5+5+5
  });

  it('should access user-defined variables', () => {
    const { executor } = compileLoopExpression('sum(i, 1, 3, i * scale)', [
      'scale',
    ]);
    const result = executor(0, 0, { scale: 2 });
    expect(result).toBe(12); // (1*2) + (2*2) + (3*2) = 2+4+6
  });

  it('should compile nested sum', () => {
    const { executor } = compileLoopExpression(
      'sum(i, 1, 3, sum(j, 1, 2, i*j))',
      []
    );
    const result = executor(0, 0, {});
    // i=1: j=1,2 -> 1*1+1*2 = 3
    // i=2: j=1,2 -> 2*1+2*2 = 6
    // i=3: j=1,2 -> 3*1+3*2 = 9
    // Total: 3+6+9 = 18
    expect(result).toBe(18);
  });

  it('should compile sum with sin function', () => {
    const { executor } = compileLoopExpression('sum(k, 0, 0, sin(k))', []);
    const result = executor(0, 0, {});
    expect(result).toBeCloseTo(0); // sin(0) = 0
  });

  it('should compile sum with pi constant', () => {
    const { executor } = compileLoopExpression('sum(k, 1, 1, sin(k * pi))', []);
    const result = executor(0, 0, {});
    expect(result).toBeCloseTo(0); // sin(pi) ≈ 0
  });

  it('should handle Math.* syntax', () => {
    const { executor } = compileLoopExpression(
      'sum(i, 1, 3, Math.pow(i, 2))',
      []
    );
    const result = executor(0, 0, {});
    expect(result).toBe(14); // 1 + 4 + 9
  });

  it('should compile loop in larger expression', () => {
    const { executor } = compileLoopExpression('10 + sum(i, 1, 3, i) * 2', []);
    const result = executor(0, 0, {});
    expect(result).toBe(22); // 10 + (1+2+3) * 2 = 10 + 12
  });

  it('should generate JavaScript code', () => {
    const { jsCode } = compileLoopExpression('sum(i, 0, 5, i)', []);
    expect(jsCode).toContain('for');
    expect(jsCode).toContain('__sum');
  });

  it('should handle exceeding iteration limit gracefully', () => {
    // The executor catches runtime errors and returns 0 for safety
    const { executor } = compileLoopExpression('sum(i, 0, 100000, 1)', [], {
      maxIterations: 100,
    });
    const result = executor(0, 0, {});
    // Error is caught and returns 0
    expect(result).toBe(0);
  });

  it('should throw on invalid nesting depth', () => {
    const expr = 'sum(a, 0, 2, sum(b, 0, 2, sum(c, 0, 2, sum(d, 0, 2, 1))))';
    expect(() => {
      compileLoopExpression(expr, []);
    }).toThrow(ParticleExpressionError);
  });
});

describe('compileExpressionWithLoops', () => {
  it('should compile expression without loops', () => {
    const result = compileExpressionWithLoops('n * t', []);
    expect(result.hasLoops).toBe(false);
    expect(result.fn(2, 3, {})).toBe(6);
  });

  it('should compile expression with loops', () => {
    const result = compileExpressionWithLoops('sum(i, 1, 5, i)', []);
    expect(result.hasLoops).toBe(true);
    expect(result.fn(0, 0, {})).toBe(15);
  });

  it('should generate JS code for expression without loops', () => {
    const result = compileExpressionWithLoops('n + t', []);
    expect(result.jsCode).toContain('n');
    expect(result.jsCode).toContain('t');
  });

  it('should generate JS code for expression with loops', () => {
    const result = compileExpressionWithLoops('sum(i, 0, 5, i)', []);
    expect(result.jsCode).toContain('for');
  });
});

describe('practical examples', () => {
  it('should compute Fourier series approximation', () => {
    // Fourier series: sum of sin(k*x)/k for k=1 to N approximates sawtooth
    const { executor } = compileLoopExpression(
      'sum(k, 1, 10, sin(k * theta) / k)',
      ['theta']
    );
    const result = executor(0, 0, { theta: Math.PI / 2 });
    expect(typeof result).toBe('number');
    expect(isFinite(result)).toBe(true);
  });

  it('should compute multi-arm spiral overlay', () => {
    // Sum of cosine functions for multiple spiral arms
    const { executor } = compileLoopExpression(
      'sum(arm, 0, 5, cos(theta + arm * 2 * pi / 6))',
      ['theta']
    );
    const result = executor(0, 0, { theta: 0 });
    expect(typeof result).toBe('number');
    expect(isFinite(result)).toBe(true);
  });

  it('should compute polynomial', () => {
    // Sum of powers: a_0 + a_1*x + a_2*x^2 + ...
    const { executor } = compileLoopExpression('sum(k, 0, 3, pow(x, k))', ['x']);
    // For x=2: 1 + 2 + 4 + 8 = 15
    const result = executor(0, 0, { x: 2 });
    expect(result).toBe(15);
  });

  it('should handle negative step', () => {
    const { executor } = compileLoopExpression('sum(i, 5, 1, -1, i)', []);
    const result = executor(0, 0, {});
    expect(result).toBe(15); // 5+4+3+2+1
  });

  it('should handle float bounds', () => {
    const { executor } = compileLoopExpression('sum(i, 0.5, 2.5, 1, i)', []);
    const result = executor(0, 0, {});
    expect(result).toBeCloseTo(4.5); // 0.5 + 1.5 + 2.5
  });
});

describe('error handling', () => {
  it('should return 0 for invalid result', () => {
    const { executor } = compileLoopExpression('sum(i, 1, 1, 0/0)', []);
    const result = executor(0, 0, {});
    expect(result).toBe(0); // NaN becomes 0
  });

  it('should handle division by zero in body', () => {
    const { executor } = compileLoopExpression('sum(i, 0, 2, 1/i)', []);
    const result = executor(0, 0, {});
    // First iteration divides by 0, should be handled gracefully
    expect(isFinite(result) || result === 0).toBe(true);
  });
});
