/**
 * Loop Configuration Constants
 * Safety limits for loop expressions in particle DSL
 */

// ============================================
// Loop Safety Limits
// ============================================

/** Maximum iterations for a single loop */
export const LOOP_MAX_ITERATIONS = 10000;

/** Maximum nesting depth for loops */
export const LOOP_MAX_NESTING_DEPTH = 3;

/** Maximum character length for loop body expression */
export const LOOP_MAX_BODY_LENGTH = 500;

/** Maximum total iterations across all nested loops */
export const LOOP_MAX_TOTAL_ITERATIONS = 100000;

/** Default step value when not specified */
export const LOOP_DEFAULT_STEP = 1;
