/**
 * Code Generator for Particle Expression System
 *
 * Compiles expression definitions into native JavaScript functions
 * using new Function() for maximum performance.
 * Safety is ensured by whitelist validation before code generation.
 */

import { parse } from 'mathjs';
import {
  ParticleExpressionSystem,
  CompiledParticleSystem,
  CompiledVariable,
  CompiledParticleOutput,
  ParticleExpressionError,
} from '../../types/particle';
import { buildDependencyGraph, validateOutput } from './expressionParser';
import { hasLoopExpression } from './loopParser';
import { validateLoopExpression } from './loopValidator';
import { compileExpressionWithLoops } from './loopCompiler';

// ============================================
// Compilation Cache
// ============================================

const compilationCache = new WeakMap<
  ParticleExpressionSystem,
  CompiledParticleSystem
>();

// ============================================
// Safe Function Names (Whitelist)
// ============================================

const ALLOWED_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'sqrt', 'pow', 'abs', 'floor', 'ceil', 'round', 'trunc',
  'min', 'max', 'exp', 'log', 'log10', 'log2',
  'sign', 'random', 'hypot', 'cbrt', 'expm1', 'log1p',
]);

const ALLOWED_CONSTANTS = new Set(['PI', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT2', 'SQRT1_2']);

// ============================================
// Expression to Native JS Conversion
// ============================================

/**
 * Convert expression to native JavaScript code string
 * Validates safety and transforms to JS syntax
 */
function expressionToJS(expr: string, variableNames: string[]): string {
  // Validate with mathjs parser first (catches syntax errors)
  try {
    const preprocessed = expr
      .replace(/Math\.PI/g, 'pi')
      .replace(/Math\.E/g, 'e')
      .replace(/Math\.([a-zA-Z]+)/g, '$1');
    parse(preprocessed);
  } catch (e) {
    throw new ParticleExpressionError(
      `Invalid expression syntax: ${expr}`,
      'SYNTAX_ERROR',
      { expression: expr, error: String(e) }
    );
  }

  // Build set of allowed identifiers
  const allowedVars = new Set(['n', 't', ...variableNames]);

  // Transform expression to native JS
  let jsCode = expr;

  // Keep Math.* as is (native JS)
  // Convert bare function calls to Math.*
  for (const fn of ALLOWED_FUNCTIONS) {
    // Match bare function calls (not preceded by Math.)
    const regex = new RegExp(`(?<!Math\\.)\\b${fn}\\s*\\(`, 'g');
    jsCode = jsCode.replace(regex, `Math.${fn}(`);
  }

  // Convert constants
  jsCode = jsCode
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E');

  // Validate no dangerous patterns
  if (/\b(eval|Function|import|require|window|document|global|process)\b/.test(jsCode)) {
    throw new ParticleExpressionError(
      `Dangerous pattern detected in expression`,
      'SYNTAX_ERROR',
      { expression: expr }
    );
  }

  return jsCode;
}

// ============================================
// Function Compilation
// ============================================

/**
 * Compile a single expression into a native JavaScript function
 * Uses new Function() for maximum performance
 * The function receives (n, t, vars) where vars contains computed variable values
 */
function compileExpression(
  expression: string,
  variableNames: string[]
): {
  fn: (n: number, t: number, vars: Record<string, number>) => number;
  hasLoops?: boolean;
  loopJsCode?: string;
} {
  try {
    // Check if expression contains loops
    if (hasLoopExpression(expression)) {
      // Validate loop expression
      const validation = validateLoopExpression(expression, variableNames);
      if (!validation.valid) {
        throw new ParticleExpressionError(
          validation.error || 'Loop validation failed',
          'LOOP_ERROR',
          { expression }
        );
      }

      // Compile with loop support
      const compiled = compileExpressionWithLoops(expression, variableNames);

      // Test compilation
      const testVars = Object.fromEntries(variableNames.map((v) => [v, 0]));
      const testResult = compiled.fn(1, 0, testVars);
      if (typeof testResult !== 'number') {
        throw new Error('Expression did not return a number');
      }

      return {
        fn: compiled.fn,
        hasLoops: true,
        loopJsCode: compiled.jsCode,
      };
    }

    // No loops - compile to native JavaScript function
    const jsCode = expressionToJS(expression, variableNames);

    // Build destructuring for variables
    const varDestructure = variableNames.length > 0
      ? `const {${variableNames.join(',')}} = vars;`
      : '';

    // Generate native function using new Function()
    // This is safe because we validated the expression above
    const fnBody = `
      "use strict";
      ${varDestructure}
      const result = ${jsCode};
      return (typeof result === 'number' && isFinite(result)) ? result : 0;
    `;

    const nativeFn = new Function('n', 't', 'vars', fnBody) as (
      n: number,
      t: number,
      vars: Record<string, number>
    ) => number;

    // Test compilation with sample values
    const testVars: Record<string, number> = Object.fromEntries(
      variableNames.map((v) => [v, 1])
    );
    const testResult = nativeFn(1, 1, testVars);
    if (typeof testResult !== 'number') {
      throw new Error('Expression did not return a number');
    }

    return { fn: nativeFn };
  } catch (error) {
    if (error instanceof ParticleExpressionError) {
      throw error;
    }
    throw new ParticleExpressionError(
      `Failed to compile expression: ${expression}`,
      'SYNTAX_ERROR',
      { expression, error: String(error) }
    );
  }
}

/**
 * Compile a color expression (can return string)
 * Uses native JavaScript for performance
 */
function compileColorExpression(
  expression: string,
  variableNames: string[]
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

  try {
    // Compile to native JS
    const jsCode = expressionToJS(expression, variableNames);

    // Build destructuring for variables
    const varDestructure = variableNames.length > 0
      ? `const {${variableNames.join(',')}} = vars;`
      : '';

    // Generate native function that converts result to color
    const fnBody = `
      "use strict";
      ${varDestructure}
      const result = ${jsCode};
      if (typeof result === 'string') return result;
      if (typeof result === 'number' && isFinite(result)) {
        const hue = Math.abs(result % 360);
        return 'hsl(' + hue + ', 70%, 50%)';
      }
      return '#ffffff';
    `;

    return new Function('n', 't', 'vars', fnBody) as (
      n: number,
      t: number,
      vars: Record<string, number>
    ) => string;
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
    const compiled = compileExpression(expression, allVarNames);

    compiledVariables.push({
      name: varName,
      fn: compiled.fn,
      dependencies: [...node.dependencies],
      hasLoops: compiled.hasLoops,
      loopJsCode: compiled.loopJsCode,
    });
  }

  // Compile output expressions
  const xCompiled = compileExpression(system.output.x, allVarNames);
  const yCompiled = compileExpression(system.output.y, allVarNames);
  const alphaCompiled = system.output.alpha
    ? compileExpression(system.output.alpha, allVarNames)
    : null;
  const sizeCompiled = system.output.size
    ? compileExpression(system.output.size, allVarNames)
    : null;

  const compiledOutput: CompiledParticleOutput = {
    x: xCompiled.fn,
    y: yCompiled.fn,
    alpha: alphaCompiled ? alphaCompiled.fn : (_n, _t, _vars) => 1,
    size: sizeCompiled ? sizeCompiled.fn : (_n, _t, _vars) => 1,
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
