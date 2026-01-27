/**
 * Loop Compiler for Particle Expression System
 *
 * Compiles loop expressions (sum/prod) into executable functions
 * and generates pure JavaScript code for HTML export.
 */

import { compile, EvalFunction } from 'mathjs';
import {
  ParsedLoop,
  CompiledLoop,
  LoopConfig,
  ParticleExpressionError,
} from '../../types/particle';
import { parseLoops, extractLoopIterators } from './loopParser';
import { validateLoopExpression, getDefaultLoopConfig } from './loopValidator';
import {
  LOOP_MAX_ITERATIONS,
  LOOP_DEFAULT_STEP,
} from '../../constants/loopConfig';

// ============================================
// Expression Preprocessing
// ============================================

/**
 * Preprocess expression: convert JavaScript Math.* syntax to mathjs syntax
 */
function preprocessExpression(expr: string): string {
  return expr
    .replace(/Math\.PI/g, 'pi')
    .replace(/Math\.E/g, 'e')
    .replace(/Math\.LN2/g, 'log(2)')
    .replace(/Math\.LN10/g, 'log(10)')
    .replace(/Math\.LOG2E/g, '(1/log(2))')
    .replace(/Math\.LOG10E/g, '(1/log(10))')
    .replace(/Math\.SQRT2/g, 'sqrt(2)')
    .replace(/Math\.SQRT1_2/g, 'sqrt(0.5)')
    .replace(/Math\.([a-zA-Z]+)/g, '$1');
}

// ============================================
// Loop Runtime Functions
// ============================================

/**
 * Runtime sum loop function
 */
function runtimeSum(
  start: number,
  end: number,
  step: number,
  bodyFn: (i: number) => number,
  maxIter: number
): number {
  let result = 0;
  let iterations = 0;

  if (step === 0) {
    throw new Error('Loop step cannot be zero');
  }

  // Determine iteration direction
  const ascending = step > 0;

  for (
    let i = start;
    ascending ? i <= end : i >= end;
    i += step
  ) {
    result += bodyFn(i);
    iterations++;
    if (iterations > maxIter) {
      throw new Error(`Sum loop exceeded ${maxIter} iterations`);
    }
  }

  return result;
}

/**
 * Runtime product loop function
 */
function runtimeProd(
  start: number,
  end: number,
  step: number,
  bodyFn: (i: number) => number,
  maxIter: number
): number {
  let result = 1;
  let iterations = 0;

  if (step === 0) {
    throw new Error('Loop step cannot be zero');
  }

  const ascending = step > 0;

  for (
    let i = start;
    ascending ? i <= end : i >= end;
    i += step
  ) {
    result *= bodyFn(i);
    iterations++;
    if (iterations > maxIter) {
      throw new Error(`Prod loop exceeded ${maxIter} iterations`);
    }
  }

  return result;
}

// ============================================
// Compilation Helpers
// ============================================

/**
 * Compile a simple expression (no loops) using mathjs
 */
function compileSimpleExpression(
  expr: string,
  scope: Record<string, number>
): number {
  const processed = preprocessExpression(expr);
  const compiled = compile(processed);
  return compiled.evaluate(scope);
}

/**
 * Create a compiled function for a loop body
 */
function compileLoopBody(
  body: string,
  iterator: string,
  variableNames: string[],
  config: LoopConfig
): (
  iteratorValue: number,
  n: number,
  t: number,
  vars: Record<string, number>
) => number {
  // Check if body contains nested loops
  const bodyParseResult = parseLoops(body);

  if (bodyParseResult.hasLoops) {
    // Recursively compile nested loops
    const nestedCompiled = compileLoopExpressionInternal(
      body,
      [...variableNames, iterator],
      config
    );

    return (
      iteratorValue: number,
      n: number,
      t: number,
      vars: Record<string, number>
    ) => {
      const extendedVars = { ...vars, [iterator]: iteratorValue };
      return nestedCompiled.executor(n, t, extendedVars);
    };
  }

  // Simple body - compile with mathjs
  const processed = preprocessExpression(body);
  const compiled: EvalFunction = compile(processed);

  return (
    iteratorValue: number,
    n: number,
    t: number,
    vars: Record<string, number>
  ) => {
    const scope = { n, t, ...vars, [iterator]: iteratorValue };
    try {
      const result = compiled.evaluate(scope);
      if (typeof result !== 'number' || !isFinite(result)) {
        return 0;
      }
      return result;
    } catch {
      return 0;
    }
  };
}

/**
 * Compile a loop bounds expression
 */
function compileBoundsExpression(
  expr: string
): (n: number, t: number, vars: Record<string, number>) => number {
  const processed = preprocessExpression(expr);
  const compiled: EvalFunction = compile(processed);

  return (n: number, t: number, vars: Record<string, number>) => {
    const scope = { n, t, ...vars };
    try {
      const result = compiled.evaluate(scope);
      if (typeof result !== 'number' || !isFinite(result)) {
        return 0;
      }
      return result;
    } catch {
      return 0;
    }
  };
}

// ============================================
// JavaScript Code Generation
// ============================================

/**
 * Generate JavaScript code for a loop
 */
function generateLoopJsCode(loop: ParsedLoop, indent: string = ''): string {
  const { type, iterator, start, end, step, body } = loop;
  const resultVar = type === 'sum' ? '__sum' : '__prod';
  const initialValue = type === 'sum' ? '0' : '1';
  const operator = type === 'sum' ? '+=' : '*=';

  // Convert body - check for nested loops
  const bodyParseResult = parseLoops(body);
  let bodyCode: string;

  if (bodyParseResult.hasLoops) {
    // Generate nested loop code
    const nestedLoopCodes = bodyParseResult.loops.map((l) =>
      generateLoopJsCode(l, indent + '    ')
    );
    bodyCode = nestedLoopCodes.join('\n');
  } else {
    // Simple expression
    bodyCode = `${indent}    ${resultVar} ${operator} (${preprocessExpression(body)});`;
  }

  const stepValue = step || String(LOOP_DEFAULT_STEP);
  const stepExpr = preprocessExpression(stepValue);
  const startExpr = preprocessExpression(start);
  const endExpr = preprocessExpression(end);

  return `${indent}(function() {
${indent}  var ${resultVar} = ${initialValue};
${indent}  var __step = ${stepExpr};
${indent}  var __start = ${startExpr};
${indent}  var __end = ${endExpr};
${indent}  if (__step > 0) {
${indent}    for (var ${iterator} = __start; ${iterator} <= __end; ${iterator} += __step) {
${bodyCode}
${indent}    }
${indent}  } else {
${indent}    for (var ${iterator} = __start; ${iterator} >= __end; ${iterator} += __step) {
${bodyCode}
${indent}    }
${indent}  }
${indent}  return ${resultVar};
${indent}})()`;
}

/**
 * Generate complete JavaScript code for an expression with loops
 */
function generateExpressionJsCode(
  expression: string,
  parseResult: ReturnType<typeof parseLoops>
): string {
  if (!parseResult.hasLoops) {
    return preprocessExpression(expression);
  }

  // Replace each loop with its generated JS code
  let result = expression;

  // Process loops in reverse order to preserve positions
  const sortedLoops = [...parseResult.loops].sort(
    (a, b) => b.position.start - a.position.start
  );

  for (const loop of sortedLoops) {
    const loopCode = generateLoopJsCode(loop);
    result =
      result.slice(0, loop.position.start) +
      loopCode +
      result.slice(loop.position.end);
  }

  return preprocessExpression(result);
}

// ============================================
// Internal Compilation
// ============================================

/**
 * Internal loop expression compiler
 */
function compileLoopExpressionInternal(
  expression: string,
  variableNames: string[],
  config: LoopConfig
): CompiledLoop {
  const parseResult = parseLoops(expression);

  if (!parseResult.hasLoops) {
    // No loops - use simple mathjs compilation
    const processed = preprocessExpression(expression);
    const compiled: EvalFunction = compile(processed);

    const executor = (
      n: number,
      t: number,
      vars: Record<string, number>
    ): number => {
      const scope = { n, t, ...vars };
      try {
        const result = compiled.evaluate(scope);
        if (typeof result !== 'number' || !isFinite(result)) {
          return 0;
        }
        return result;
      } catch {
        return 0;
      }
    };

    return {
      executor,
      jsCode: processed,
    };
  }

  // Build executor function that handles loops
  const executor = (
    n: number,
    t: number,
    vars: Record<string, number>
  ): number => {
    // Evaluate expression, replacing loops with their computed values
    let workingExpr = expression;

    // Process loops in reverse order
    const sortedLoops = [...parseResult.loops].sort(
      (a, b) => b.position.start - a.position.start
    );

    for (const loop of sortedLoops) {
      // Compile bounds
      const startFn = compileBoundsExpression(loop.start);
      const endFn = compileBoundsExpression(loop.end);
      const stepFn = loop.step
        ? compileBoundsExpression(loop.step)
        : () => LOOP_DEFAULT_STEP;

      // Evaluate bounds
      const startVal = startFn(n, t, vars);
      const endVal = endFn(n, t, vars);
      const stepVal = stepFn(n, t, vars);

      // Compile body
      const bodyFn = compileLoopBody(
        loop.body,
        loop.iterator,
        variableNames,
        config
      );

      // Execute loop
      let loopResult: number;
      try {
        if (loop.type === 'sum') {
          loopResult = runtimeSum(
            startVal,
            endVal,
            stepVal,
            (i) => bodyFn(i, n, t, vars),
            config.maxIterations
          );
        } else {
          loopResult = runtimeProd(
            startVal,
            endVal,
            stepVal,
            (i) => bodyFn(i, n, t, vars),
            config.maxIterations
          );
        }
      } catch (err) {
        console.warn('Loop execution error:', err);
        loopResult = 0;
      }

      // Replace loop in expression with its value
      workingExpr =
        workingExpr.slice(0, loop.position.start) +
        String(loopResult) +
        workingExpr.slice(loop.position.end);
    }

    // Evaluate remaining expression
    try {
      const processed = preprocessExpression(workingExpr);
      const compiled: EvalFunction = compile(processed);
      const result = compiled.evaluate({ n, t, ...vars });

      if (typeof result !== 'number' || !isFinite(result)) {
        return 0;
      }
      return result;
    } catch {
      return 0;
    }
  };

  // Generate JS code
  const jsCode = generateExpressionJsCode(expression, parseResult);

  return {
    executor,
    jsCode,
  };
}

// ============================================
// Public API
// ============================================

/**
 * Compile a loop expression into an executable function
 *
 * @param expression - The expression containing sum/prod loops
 * @param variableNames - Names of user-defined variables available in scope
 * @param config - Optional loop configuration overrides
 * @returns CompiledLoop with executor function and JS code for export
 */
export function compileLoopExpression(
  expression: string,
  variableNames: string[] = [],
  config: Partial<LoopConfig> = {}
): CompiledLoop {
  const fullConfig = { ...getDefaultLoopConfig(), ...config };

  // Validate first
  const validation = validateLoopExpression(expression, variableNames, fullConfig);
  if (!validation.valid) {
    throw new ParticleExpressionError(
      validation.error || 'Loop validation failed',
      'LOOP_ERROR',
      { expression }
    );
  }

  try {
    return compileLoopExpressionInternal(expression, variableNames, fullConfig);
  } catch (error) {
    throw new ParticleExpressionError(
      `Failed to compile loop expression: ${error instanceof Error ? error.message : String(error)}`,
      'SYNTAX_ERROR',
      { expression, error: String(error) }
    );
  }
}

/**
 * Check if an expression contains loops and compile appropriately
 */
export function compileExpressionWithLoops(
  expression: string,
  variableNames: string[] = [],
  config: Partial<LoopConfig> = {}
): {
  fn: (n: number, t: number, vars: Record<string, number>) => number;
  hasLoops: boolean;
  jsCode: string;
} {
  const parseResult = parseLoops(expression);

  if (!parseResult.hasLoops) {
    // Use simple mathjs compilation
    const processed = preprocessExpression(expression);
    const compiled: EvalFunction = compile(processed);

    const fn = (
      n: number,
      t: number,
      vars: Record<string, number>
    ): number => {
      const scope = { n, t, ...vars };
      try {
        const result = compiled.evaluate(scope);
        if (typeof result !== 'number' || !isFinite(result)) {
          return 0;
        }
        return result;
      } catch {
        return 0;
      }
    };

    return {
      fn,
      hasLoops: false,
      jsCode: processed,
    };
  }

  const compiled = compileLoopExpression(expression, variableNames, config);

  return {
    fn: compiled.executor,
    hasLoops: true,
    jsCode: compiled.jsCode,
  };
}

// Re-export for convenience
export { parseLoops, extractLoopIterators } from './loopParser';
export { validateLoopExpression, calculateNestingDepth } from './loopValidator';
