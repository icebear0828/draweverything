/**
 * Tests for Loop Parser
 */

import { describe, it, expect } from 'vitest';
import {
  parseLoops,
  extractLoopIterators,
  hasLoopExpression,
  getLoopFunctions,
} from '@/utils/particle/loopParser';

describe('parseLoops', () => {
  it('should return hasLoops: false for expression without loops', () => {
    const result = parseLoops('n * sin(t)');
    expect(result.hasLoops).toBe(false);
    expect(result.loops).toHaveLength(0);
    expect(result.transformedExpr).toBe('n * sin(t)');
  });

  it('should parse simple sum with 4 arguments', () => {
    const result = parseLoops('sum(i, 0, 10, sin(i))');
    expect(result.hasLoops).toBe(true);
    expect(result.loops).toHaveLength(1);

    const loop = result.loops[0];
    expect(loop.type).toBe('sum');
    expect(loop.iterator).toBe('i');
    expect(loop.start).toBe('0');
    expect(loop.end).toBe('10');
    expect(loop.step).toBeNull();
    expect(loop.body).toBe('sin(i)');
  });

  it('should parse sum with 5 arguments (with step)', () => {
    const result = parseLoops('sum(i, 0, 100, 2, i)');
    expect(result.hasLoops).toBe(true);
    expect(result.loops).toHaveLength(1);

    const loop = result.loops[0];
    expect(loop.type).toBe('sum');
    expect(loop.iterator).toBe('i');
    expect(loop.start).toBe('0');
    expect(loop.end).toBe('100');
    expect(loop.step).toBe('2');
    expect(loop.body).toBe('i');
  });

  it('should parse prod loop', () => {
    const result = parseLoops('prod(i, 1, 5, i)');
    expect(result.hasLoops).toBe(true);
    expect(result.loops).toHaveLength(1);

    const loop = result.loops[0];
    expect(loop.type).toBe('prod');
    expect(loop.iterator).toBe('i');
    expect(loop.start).toBe('1');
    expect(loop.end).toBe('5');
    expect(loop.body).toBe('i');
  });

  it('should parse nested loops', () => {
    const result = parseLoops('sum(i, 0, 5, sum(j, 0, 5, i*j))');
    expect(result.hasLoops).toBe(true);
    expect(result.loops).toHaveLength(2);

    // Outer loop
    const outerLoop = result.loops.find((l) => l.iterator === 'i');
    expect(outerLoop).toBeDefined();
    expect(outerLoop!.body).toBe('sum(j, 0, 5, i*j)');

    // Inner loop
    const innerLoop = result.loops.find((l) => l.iterator === 'j');
    expect(innerLoop).toBeDefined();
    expect(innerLoop!.body).toBe('i*j');
  });

  it('should parse loop in complex expression', () => {
    const result = parseLoops('r * sum(k, 1, 10, sin(k*theta)) + 1');
    expect(result.hasLoops).toBe(true);
    expect(result.loops).toHaveLength(1);

    const loop = result.loops[0];
    expect(loop.type).toBe('sum');
    expect(loop.iterator).toBe('k');
    expect(loop.body).toBe('sin(k*theta)');
  });

  it('should handle multiple independent loops', () => {
    const result = parseLoops('sum(i, 0, 5, i) + prod(j, 1, 3, j)');
    expect(result.hasLoops).toBe(true);
    expect(result.loops).toHaveLength(2);

    const sumLoop = result.loops.find((l) => l.type === 'sum');
    const prodLoop = result.loops.find((l) => l.type === 'prod');

    expect(sumLoop).toBeDefined();
    expect(prodLoop).toBeDefined();
    expect(sumLoop!.iterator).toBe('i');
    expect(prodLoop!.iterator).toBe('j');
  });

  it('should handle expressions in loop bounds', () => {
    const result = parseLoops('sum(i, 0, n-1, i*t)');
    expect(result.hasLoops).toBe(true);

    const loop = result.loops[0];
    expect(loop.start).toBe('0');
    expect(loop.end).toBe('n-1');
    expect(loop.body).toBe('i*t');
  });

  it('should handle nested parentheses in body', () => {
    const result = parseLoops('sum(i, 0, 10, sin(cos(i * pi)))');
    expect(result.hasLoops).toBe(true);

    const loop = result.loops[0];
    expect(loop.body).toBe('sin(cos(i * pi))');
  });

  it('should replace loops with placeholders', () => {
    const result = parseLoops('1 + sum(i, 0, 5, i) + 2');
    expect(result.transformedExpr).toContain('__LOOP_');
  });
});

describe('extractLoopIterators', () => {
  it('should return empty set for expression without loops', () => {
    const iterators = extractLoopIterators('n * sin(t)');
    expect(iterators.size).toBe(0);
  });

  it('should extract single iterator', () => {
    const iterators = extractLoopIterators('sum(i, 0, 10, i)');
    expect(iterators.has('i')).toBe(true);
    expect(iterators.size).toBe(1);
  });

  it('should extract multiple iterators from nested loops', () => {
    const iterators = extractLoopIterators('sum(i, 0, 5, sum(j, 0, 5, i*j))');
    expect(iterators.has('i')).toBe(true);
    expect(iterators.has('j')).toBe(true);
    expect(iterators.size).toBe(2);
  });

  it('should extract iterators from multiple independent loops', () => {
    const iterators = extractLoopIterators('sum(a, 0, 5, a) + prod(b, 1, 3, b)');
    expect(iterators.has('a')).toBe(true);
    expect(iterators.has('b')).toBe(true);
    expect(iterators.size).toBe(2);
  });
});

describe('hasLoopExpression', () => {
  it('should return false for expression without loops', () => {
    expect(hasLoopExpression('n * sin(t)')).toBe(false);
    expect(hasLoopExpression('Math.pow(n, 2)')).toBe(false);
  });

  it('should return true for expression with sum', () => {
    expect(hasLoopExpression('sum(i, 0, 10, i)')).toBe(true);
  });

  it('should return true for expression with prod', () => {
    expect(hasLoopExpression('prod(i, 1, 5, i)')).toBe(true);
  });

  it('should return true when loop is embedded', () => {
    expect(hasLoopExpression('1 + sum(i, 0, 5, i) * 2')).toBe(true);
  });
});

describe('getLoopFunctions', () => {
  it('should return array containing sum and prod', () => {
    const funcs = getLoopFunctions();
    expect(funcs).toContain('sum');
    expect(funcs).toContain('prod');
  });
});
