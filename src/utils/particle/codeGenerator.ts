/**
 * Code Generator for Particle Expression System
 *
 * Compiles expression definitions into executable JavaScript functions
 * using mathjs for safe AST-based expression evaluation
 */

import { compile, EvalFunction } from 'mathjs';
import {
  ParticleExpressionSystem,
  CompiledParticleSystem,
  CompiledVariable,
  CompiledParticleOutput,
  ParticleExpressionError,
} from '../../types/particle';
import { buildDependencyGraph, validateOutput } from './expressionParser';

// ============================================
// Compilation Cache
// ============================================

const compilationCache = new WeakMap<
  ParticleExpressionSystem,
  CompiledParticleSystem
>();

// ============================================
// Expression Preprocessing
// ============================================

/**
 * Preprocess expression: convert JavaScript Math.* syntax to mathjs syntax
 */
function preprocessExpression(expr: string): string {
  return expr
    // 常量转换
    .replace(/Math\.PI/g, 'pi')
    .replace(/Math\.E/g, 'e')
    .replace(/Math\.LN2/g, 'log(2)')
    .replace(/Math\.LN10/g, 'log(10)')
    .replace(/Math\.LOG2E/g, '(1/log(2))')
    .replace(/Math\.LOG10E/g, '(1/log(10))')
    .replace(/Math\.SQRT2/g, 'sqrt(2)')
    .replace(/Math\.SQRT1_2/g, 'sqrt(0.5)')
    // 函数调用转换 - 移除 Math. 前缀
    .replace(/Math\.([a-zA-Z]+)/g, '$1');
}

// ============================================
// Function Compilation
// ============================================

/**
 * Compile a single expression into a function using mathjs
 * The function receives (n, t, vars) where vars contains computed variable values
 */
function compileExpression(
  expression: string,
  variableNames: string[]
): (n: number, t: number, vars: Record<string, number>) => number {
  try {
    // Preprocess to convert Math.* to mathjs format
    const processedExpr = preprocessExpression(expression);

    // Compile with mathjs
    const compiled: EvalFunction = compile(processedExpr);

    // Create wrapper function that builds scope from n, t, and vars
    const fn = (
      n: number,
      t: number,
      vars: Record<string, number>
    ): number => {
      // Build scope with all variables
      const scope: Record<string, number> = {
        n,
        t,
        ...vars,
      };

      try {
        const result = compiled.evaluate(scope);
        // Ensure we return a valid number
        if (typeof result !== 'number' || !isFinite(result)) {
          return 0;
        }
        return result;
      } catch {
        return 0;
      }
    };

    // Test compilation with sample values
    const testVars = Object.fromEntries(variableNames.map((v) => [v, 0]));
    const testResult = fn(1, 0, testVars);
    if (typeof testResult !== 'number') {
      throw new Error('Expression did not return a number');
    }

    return fn;
  } catch (error) {
    throw new ParticleExpressionError(
      `Failed to compile expression: ${expression}`,
      'SYNTAX_ERROR',
      { expression, error: String(error) }
    );
  }
}

/**
 * Compile a color expression (can return string)
 * Note: Color expressions may use template literals or string operations
 * which mathjs doesn't support directly. For now, we handle simple cases.
 */
function compileColorExpression(
  expression: string,
  _variableNames: string[]
): ((n: number, t: number, vars: Record<string, number>) => string) | null {
  if (!expression) return null;

  // Check if it's a simple string literal (hex color)
  const trimmed = expression.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    // Return the string literal directly
    const colorValue = trimmed.slice(1, -1);
    return () => colorValue;
  }

  // Check if it's a template literal with stdlib color functions
  // For complex color expressions, we need to evaluate them differently
  // For now, we'll use a simple approach for common patterns

  try {
    // Try to compile as a mathematical expression that returns a value
    // that can be converted to a color string
    const processedExpr = preprocessExpression(expression);
    const compiled: EvalFunction = compile(processedExpr);

    return (n: number, t: number, vars: Record<string, number>): string => {
      const scope: Record<string, number> = { n, t, ...vars };
      try {
        const result = compiled.evaluate(scope);
        // If it returns a string, use it directly
        if (typeof result === 'string') {
          return result;
        }
        // If it returns a number, convert to hex color
        if (typeof result === 'number' && isFinite(result)) {
          const hue = Math.abs(result % 360);
          return `hsl(${hue}, 70%, 50%)`;
        }
        return '#ffffff';
      } catch {
        return '#ffffff';
      }
    };
  } catch (error) {
    throw new ParticleExpressionError(
      `Failed to compile color expression: ${expression}`,
      'SYNTAX_ERROR',
      { expression, error: String(error) }
    );
  }
}

// ============================================
// Main Compilation
// ============================================

/**
 * Compile a particle expression system into an executable form
 */
export function compileParticleExpressionSystem(
  system: ParticleExpressionSystem
): CompiledParticleSystem {
  // Check cache
  const cached = compilationCache.get(system);
  if (cached) return cached;

  // Build dependency graph and get sorted order
  const graph = buildDependencyGraph(system.definitions);

  if (graph.hasCycle) {
    throw new ParticleExpressionError(
      `Circular dependency detected: ${graph.cycleInfo?.join(' → ')}`,
      'CIRCULAR_DEP',
      { cycle: graph.cycleInfo }
    );
  }

  // Validate output expressions
  validateOutput(system.output, system.definitions);

  // Compile variables in topological order
  const compiledVariables: CompiledVariable[] = [];
  const allVarNames = Object.keys(system.definitions);

  for (const varName of graph.sortedOrder) {
    const expression = system.definitions[varName];
    const node = graph.nodes.get(varName)!;

    compiledVariables.push({
      name: varName,
      fn: compileExpression(expression, allVarNames),
      dependencies: [...node.dependencies],
    });
  }

  // Compile output expressions
  const compiledOutput: CompiledParticleOutput = {
    x: compileExpression(system.output.x, allVarNames),
    y: compileExpression(system.output.y, allVarNames),
    alpha: system.output.alpha
      ? compileExpression(system.output.alpha, allVarNames)
      : (_n, _t, _vars) => 1,
    size: system.output.size
      ? compileExpression(system.output.size, allVarNames)
      : (_n, _t, _vars) => 1,
    color: compileColorExpression(system.output.color || '', allVarNames),
  };

  const result: CompiledParticleSystem = {
    variables: compiledVariables,
    output: compiledOutput,
    particleCount: system.particleCount ?? 4000,
    timeScale: system.timeScale ?? 0.0002,
    colorHex: system.colorHex ?? '#ffffff',
  };

  // Cache the result
  compilationCache.set(system, result);

  return result;
}

// ============================================
// Runtime Execution Helper
// ============================================

/**
 * Execute a compiled system for a single particle
 * Returns { x, y, alpha, size, color }
 */
export function executeParticle(
  system: CompiledParticleSystem,
  n: number,
  t: number
): { x: number; y: number; alpha: number; size: number; color: string } {
  const vars: Record<string, number> = {};

  // Compute variables in order
  for (const variable of system.variables) {
    vars[variable.name] = variable.fn(n, t, vars);
  }

  // Compute outputs
  return {
    x: system.output.x(n, t, vars),
    y: system.output.y(n, t, vars),
    alpha: system.output.alpha(n, t, vars),
    size: system.output.size(n, t, vars),
    color: system.output.color
      ? system.output.color(n, t, vars)
      : system.colorHex,
  };
}
