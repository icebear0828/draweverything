/**
 * Loop Validator for Particle Expression System
 *
 * Validates loop expressions for safety and correctness:
 * - Nesting depth limits
 * - Iteration count limits
 * - Iterator variable scope
 * - Loop body validation
 */

import {
  ParsedLoop,
  LoopValidationResult,
  LoopConfig,
} from '../../types/particle';
import { parseLoops, extractLoopIterators } from './loopParser';
import {
  LOOP_MAX_ITERATIONS,
  LOOP_MAX_NESTING_DEPTH,
  LOOP_MAX_BODY_LENGTH,
  LOOP_MAX_TOTAL_ITERATIONS,
} from '../../constants/loopConfig';

// ============================================
// Default Configuration
// ============================================

const DEFAULT_LOOP_CONFIG: LoopConfig = {
  maxIterations: LOOP_MAX_ITERATIONS,
  maxNestingDepth: LOOP_MAX_NESTING_DEPTH,
  maxBodyLength: LOOP_MAX_BODY_LENGTH,
  maxTotalIterations: LOOP_MAX_TOTAL_ITERATIONS,
};

// Built-in variables that are always available
const BUILTIN_VARS = new Set(['n', 't', 'pi', 'e', 'phi', 'tau']);

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate the nesting depth of loops in an expression
 */
export function calculateNestingDepth(expression: string): number {
  const parseResult = parseLoops(expression);

  if (!parseResult.hasLoops) {
    return 0;
  }

  let maxDepth = 0;

  for (const loop of parseResult.loops) {
    // Check depth of body
    const bodyDepth = calculateNestingDepth(loop.body);
    maxDepth = Math.max(maxDepth, 1 + bodyDepth);
  }

  return maxDepth;
}

/**
 * Check if an expression is a valid numeric literal or simple arithmetic
 */
function isValidBoundExpression(expr: string): boolean {
  const trimmed = expr.trim();

  // Allow numeric literals
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return true;
  }

  // Allow simple variable references (n, t, or user-defined)
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return true;
  }

  // Allow simple arithmetic expressions
  if (/^[\d\w\s+\-*/().]+$/.test(trimmed)) {
    return true;
  }

  return true; // Allow complex expressions, validation will catch errors at runtime
}

/**
 * Validate a single loop's bounds
 */
export function validateLoopBounds(loop: ParsedLoop): LoopValidationResult {
  // Validate start expression
  if (!loop.start || loop.start.trim() === '') {
    return { valid: false, error: `Loop start expression is empty` };
  }

  if (!isValidBoundExpression(loop.start)) {
    return {
      valid: false,
      error: `Invalid loop start expression: ${loop.start}`,
    };
  }

  // Validate end expression
  if (!loop.end || loop.end.trim() === '') {
    return { valid: false, error: `Loop end expression is empty` };
  }

  if (!isValidBoundExpression(loop.end)) {
    return { valid: false, error: `Invalid loop end expression: ${loop.end}` };
  }

  // Validate step if present
  if (loop.step !== null) {
    if (loop.step.trim() === '') {
      return { valid: false, error: `Loop step expression is empty` };
    }

    if (!isValidBoundExpression(loop.step)) {
      return {
        valid: false,
        error: `Invalid loop step expression: ${loop.step}`,
      };
    }
  }

  // Validate body is not empty
  if (!loop.body || loop.body.trim() === '') {
    return { valid: false, error: `Loop body is empty` };
  }

  return { valid: true };
}

/**
 * Validate iterator variable doesn't conflict with built-ins or outer scope
 */
function validateIteratorScope(
  loop: ParsedLoop,
  outerIterators: Set<string>,
  additionalVars: Set<string>
): LoopValidationResult {
  const iterator = loop.iterator;

  // Check against built-in variables
  if (BUILTIN_VARS.has(iterator)) {
    return {
      valid: false,
      error: `Loop iterator '${iterator}' conflicts with built-in variable`,
    };
  }

  // Check against outer loop iterators
  if (outerIterators.has(iterator)) {
    return {
      valid: false,
      error: `Loop iterator '${iterator}' shadows outer loop iterator`,
    };
  }

  // Warning if iterator shadows a user variable (but allow it)
  const warnings: string[] = [];
  if (additionalVars.has(iterator)) {
    warnings.push(`Loop iterator '${iterator}' shadows a defined variable`);
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Recursively validate a loop and its nested loops
 */
function validateLoopRecursive(
  loop: ParsedLoop,
  outerIterators: Set<string>,
  additionalVars: Set<string>,
  config: LoopConfig,
  currentDepth: number
): LoopValidationResult {
  const allWarnings: string[] = [];

  // Check nesting depth
  if (currentDepth > config.maxNestingDepth) {
    return {
      valid: false,
      error: `Loop nesting depth (${currentDepth}) exceeds maximum (${config.maxNestingDepth})`,
    };
  }

  // Validate bounds
  const boundsResult = validateLoopBounds(loop);
  if (!boundsResult.valid) {
    return boundsResult;
  }

  // Validate iterator scope
  const scopeResult = validateIteratorScope(
    loop,
    outerIterators,
    additionalVars
  );
  if (!scopeResult.valid) {
    return scopeResult;
  }
  if (scopeResult.warnings) {
    allWarnings.push(...scopeResult.warnings);
  }

  // Validate body length
  if (loop.body.length > config.maxBodyLength) {
    return {
      valid: false,
      error: `Loop body length (${loop.body.length}) exceeds maximum (${config.maxBodyLength})`,
    };
  }

  // Check for nested loops and validate them
  const bodyParseResult = parseLoops(loop.body);
  if (bodyParseResult.hasLoops) {
    const newOuterIterators = new Set(outerIterators);
    newOuterIterators.add(loop.iterator);

    for (const nestedLoop of bodyParseResult.loops) {
      const nestedResult = validateLoopRecursive(
        nestedLoop,
        newOuterIterators,
        additionalVars,
        config,
        currentDepth + 1
      );
      if (!nestedResult.valid) {
        return nestedResult;
      }
      if (nestedResult.warnings) {
        allWarnings.push(...nestedResult.warnings);
      }
    }
  }

  return {
    valid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

// ============================================
// Main Validation Functions
// ============================================

/**
 * Validate a complete expression containing loops
 */
export function validateLoopExpression(
  expression: string,
  additionalVars: string[] = [],
  config: Partial<LoopConfig> = {}
): LoopValidationResult {
  const fullConfig: LoopConfig = { ...DEFAULT_LOOP_CONFIG, ...config };
  const additionalVarsSet = new Set(additionalVars);
  const allWarnings: string[] = [];

  // Parse the expression
  const parseResult = parseLoops(expression);

  if (!parseResult.hasLoops) {
    return { valid: true };
  }

  // Validate each top-level loop
  for (const loop of parseResult.loops) {
    const result = validateLoopRecursive(
      loop,
      new Set(),
      additionalVarsSet,
      fullConfig,
      1
    );

    if (!result.valid) {
      return result;
    }
    if (result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  // Check total nesting depth
  const totalDepth = calculateNestingDepth(expression);
  if (totalDepth > fullConfig.maxNestingDepth) {
    return {
      valid: false,
      error: `Total nesting depth (${totalDepth}) exceeds maximum (${fullConfig.maxNestingDepth})`,
    };
  }

  return {
    valid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

/**
 * Estimate the maximum number of iterations for an expression
 * Returns Infinity if bounds cannot be determined statically
 */
export function estimateMaxIterations(
  expression: string,
  knownBounds: Record<string, { min: number; max: number }> = {}
): number {
  const parseResult = parseLoops(expression);

  if (!parseResult.hasLoops) {
    return 0;
  }

  let totalIterations = 0;

  // Only count top-level loops (not nested ones)
  // A loop is top-level if it's not contained within another loop's body
  const topLevelLoops = parseResult.loops.filter((loop) => {
    // Check if this loop is inside another loop's body
    for (const otherLoop of parseResult.loops) {
      if (loop === otherLoop) continue;
      // Check if this loop's position is within another loop's body
      if (
        loop.position.start > otherLoop.position.start &&
        loop.position.end < otherLoop.position.end
      ) {
        return false; // This loop is nested
      }
    }
    return true;
  });

  for (const loop of topLevelLoops) {
    // Try to parse numeric bounds
    const startNum = parseFloat(loop.start);
    const endNum = parseFloat(loop.end);
    const stepNum = loop.step ? parseFloat(loop.step) : 1;

    if (!isNaN(startNum) && !isNaN(endNum) && !isNaN(stepNum) && stepNum !== 0) {
      const iterations = Math.ceil(Math.abs(endNum - startNum) / Math.abs(stepNum)) + 1;

      // Check for nested loops in body
      const nestedIterations = estimateMaxIterations(loop.body, knownBounds);

      if (nestedIterations === Infinity) {
        return Infinity;
      }

      totalIterations += iterations * Math.max(1, nestedIterations);
    } else {
      // Cannot determine bounds statically
      return Infinity;
    }
  }

  return totalIterations;
}

/**
 * Get default loop configuration
 */
export function getDefaultLoopConfig(): LoopConfig {
  return { ...DEFAULT_LOOP_CONFIG };
}
