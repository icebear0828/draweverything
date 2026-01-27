/**
 * Loop Parser for Particle Expression System
 *
 * Parses sum/prod loop syntax and extracts loop structure for compilation.
 * Supports:
 * - sum(i, start, end, body) - 4 argument form
 * - sum(i, start, end, step, body) - 5 argument form
 * - prod(i, start, end, body) - product loop
 * - Nested loops
 */

import { ParsedLoop, LoopParseResult } from '../../types/particle';

// ============================================
// Constants
// ============================================

const LOOP_FUNCTIONS = ['sum', 'prod'] as const;
type LoopFunctionType = (typeof LOOP_FUNCTIONS)[number];

// ============================================
// Helper Functions
// ============================================

/**
 * Find the matching closing parenthesis for an opening parenthesis
 */
function findMatchingParen(expr: string, start: number): number {
  let depth = 1;
  let i = start + 1;

  while (i < expr.length && depth > 0) {
    if (expr[i] === '(') {
      depth++;
    } else if (expr[i] === ')') {
      depth--;
    }
    i++;
  }

  return depth === 0 ? i - 1 : -1;
}

/**
 * Split arguments at top level (respecting nested parentheses)
 */
function splitTopLevelArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

/**
 * Check if a string is a valid identifier
 */
function isValidIdentifier(str: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str);
}

// ============================================
// Main Parser Functions
// ============================================

/**
 * Parse a single loop expression starting at the given position
 */
function parseLoopAt(
  expr: string,
  funcName: LoopFunctionType,
  startPos: number
): ParsedLoop | null {
  // Find the opening parenthesis
  const parenStart = startPos + funcName.length;
  if (expr[parenStart] !== '(') {
    return null;
  }

  // Find matching closing parenthesis
  const parenEnd = findMatchingParen(expr, parenStart);
  if (parenEnd === -1) {
    return null;
  }

  // Extract arguments string
  const argsStr = expr.slice(parenStart + 1, parenEnd);
  const args = splitTopLevelArgs(argsStr);

  // Validate argument count (4 or 5)
  if (args.length < 4 || args.length > 5) {
    return null;
  }

  // Parse arguments based on count
  const iterator = args[0];
  const start = args[1];
  const end = args[2];

  let step: string | null = null;
  let body: string;

  if (args.length === 5) {
    // 5 args: iterator, start, end, step, body
    step = args[3];
    body = args[4];
  } else {
    // 4 args: iterator, start, end, body
    body = args[3];
  }

  // Validate iterator is a valid identifier
  if (!isValidIdentifier(iterator)) {
    return null;
  }

  return {
    type: funcName,
    iterator,
    start,
    end,
    step,
    body,
    position: { start: startPos, end: parenEnd + 1 },
  };
}

/**
 * Find all loop expressions in an expression string
 */
function findAllLoops(expr: string): ParsedLoop[] {
  const loops: ParsedLoop[] = [];

  for (const funcName of LOOP_FUNCTIONS) {
    // Find all occurrences of this function
    const regex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    let match;

    while ((match = regex.exec(expr)) !== null) {
      // Check if this is actually a function call (not preceded by a dot)
      if (match.index > 0 && expr[match.index - 1] === '.') {
        continue;
      }

      const parsed = parseLoopAt(expr, funcName, match.index);
      if (parsed) {
        loops.push(parsed);
      }
    }
  }

  // Sort by position (start) in reverse order for proper replacement
  loops.sort((a, b) => a.position.start - b.position.start);

  return loops;
}

/**
 * Generate a unique placeholder for a loop
 */
function generatePlaceholder(index: number): string {
  return `__LOOP_${index}__`;
}

/**
 * Parse loops in an expression and return structured result
 */
export function parseLoops(expression: string): LoopParseResult {
  const loops = findAllLoops(expression);

  if (loops.length === 0) {
    return {
      hasLoops: false,
      loops: [],
      transformedExpr: expression,
    };
  }

  // Replace loops with placeholders (from end to start to preserve positions)
  let transformedExpr = expression;
  const sortedLoops = [...loops].sort(
    (a, b) => b.position.start - a.position.start
  );

  sortedLoops.forEach((loop, reverseIndex) => {
    const index = loops.length - 1 - reverseIndex;
    const placeholder = generatePlaceholder(index);
    transformedExpr =
      transformedExpr.slice(0, loop.position.start) +
      placeholder +
      transformedExpr.slice(loop.position.end);
  });

  return {
    hasLoops: true,
    loops,
    transformedExpr,
  };
}

/**
 * Extract all loop iterator variables from an expression
 * This is used to exclude them from dependency detection
 */
export function extractLoopIterators(expression: string): Set<string> {
  const iterators = new Set<string>();
  const loops = findAllLoops(expression);

  for (const loop of loops) {
    iterators.add(loop.iterator);
    // Recursively check nested loops in the body
    const nestedIterators = extractLoopIterators(loop.body);
    nestedIterators.forEach((it) => iterators.add(it));
  }

  return iterators;
}

/**
 * Check if an expression contains any loops
 */
export function hasLoopExpression(expression: string): boolean {
  for (const funcName of LOOP_FUNCTIONS) {
    const regex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    if (regex.test(expression)) {
      return true;
    }
  }
  return false;
}

/**
 * Get all loop functions for use in other modules
 */
export function getLoopFunctions(): readonly string[] {
  return LOOP_FUNCTIONS;
}
