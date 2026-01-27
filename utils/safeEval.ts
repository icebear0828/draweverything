/**
 * Safe Expression Evaluation Utilities
 *
 * 提供安全的数学表达式编译，防止代码注入攻击
 */

import { EXPRESSION_MAX_LENGTH } from '../constants/config';

// 允许的标识符白名单
const ALLOWED_IDENTIFIERS = new Set([
  // 数学常量
  'Math', 'PI', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT2', 'SQRT1_2',
  // 变量
  't', 'n', 'x', 'y', 'r', 'theta', 'rMod',
  // 常见数学函数会通过 Math. 访问
]);

// 允许的 Math 方法
const ALLOWED_MATH_METHODS = new Set([
  'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
  'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor',
  'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2', 'max',
  'min', 'pow', 'random', 'round', 'sign', 'sin', 'sinh', 'sqrt',
  'tan', 'tanh', 'trunc',
  // 常量
  'PI', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT2', 'SQRT1_2',
]);

// 危险模式检测
const DANGEROUS_PATTERNS = [
  // 函数调用 - 匹配不以 Math. 开头的函数调用
  // 使用负向后瞻 (?<!Math\.) 确保不匹配 Math.xxx(
  /(?<!Math\.)\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/,
  // 属性访问（除了 Math.xxx）
  /(?<!Math)\.[a-zA-Z_$][a-zA-Z0-9_$]*(?!\s*\()/,
  // 危险关键字
  /\b(eval|Function|constructor|prototype|__proto__|window|document|globalThis|self|this|import|require|fetch|XMLHttpRequest|WebSocket)\b/,
  // 模板字符串
  /`/,
  // 赋值操作
  /[^=!<>]=[^=]/,
  // 注释（可能用于绕过检查）
  /\/\//,
  /\/\*/,
  // 分号（多语句）
  /;/,
  // 花括号（代码块）
  /[{}]/,
  // 方括号访问（可能用于动态属性访问）
  /\[.*\]/,
];

// 允许的字符模式
const ALLOWED_CHARS_PATTERN = /^[\s\d\w.+\-*/%()^,<>=!&|?:]+$/;

/**
 * 验证表达式是否安全
 */
export function validateExpression(expr: string): { valid: boolean; error?: string } {
  if (!expr || typeof expr !== 'string') {
    return { valid: false, error: 'Expression must be a non-empty string' };
  }

  const trimmed = expr.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Expression is empty' };
  }

  if (trimmed.length > EXPRESSION_MAX_LENGTH) {
    return { valid: false, error: `Expression too long (max ${EXPRESSION_MAX_LENGTH} chars)` };
  }

  // 检查是否只包含允许的字符
  if (!ALLOWED_CHARS_PATTERN.test(trimmed)) {
    return { valid: false, error: 'Expression contains disallowed characters' };
  }

  // 检查危险模式
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: `Expression contains potentially dangerous pattern` };
    }
  }

  // 提取所有标识符并验证
  const identifiers = trimmed.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];

  for (const id of identifiers) {
    // 跳过 Math 方法检查
    if (ALLOWED_MATH_METHODS.has(id)) continue;
    if (ALLOWED_IDENTIFIERS.has(id)) continue;

    // 检查是否是数字（如 1e10 中的 e）
    if (/^\d/.test(id)) continue;

    return { valid: false, error: `Unknown identifier: ${id}` };
  }

  // 验证 Math.xxx 调用
  const mathCalls = trimmed.match(/Math\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
  for (const call of mathCalls) {
    const method = call.replace('Math.', '');
    if (!ALLOWED_MATH_METHODS.has(method)) {
      return { valid: false, error: `Unknown Math method: ${method}` };
    }
  }

  // 检查括号匹配
  let parenCount = 0;
  for (const char of trimmed) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { valid: false, error: 'Mismatched parentheses' };
    }
  }
  if (parenCount !== 0) {
    return { valid: false, error: 'Mismatched parentheses' };
  }

  return { valid: true };
}

/**
 * 安全编译数学表达式为函数
 */
export function safeCompileExpression<T extends (...args: number[]) => number>(
  expr: string,
  argNames: string[],
  fallback: T
): T {
  if (!expr || expr.trim() === '') {
    return fallback;
  }

  const validation = validateExpression(expr);
  if (!validation.valid) {
    console.warn(`Expression validation failed: ${validation.error}. Expression: "${expr}"`);
    return fallback;
  }

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...argNames, `"use strict"; return ${expr};`) as T;

    // 测试函数是否正常工作
    const testArgs = argNames.map(() => 1);
    const result = fn(...testArgs);

    if (typeof result !== 'number' || !isFinite(result)) {
      console.warn(`Expression "${expr}" returned invalid result: ${result}`);
      return fallback;
    }

    return fn;
  } catch (e) {
    console.warn(`Failed to compile expression "${expr}":`, e);
    return fallback;
  }
}

/**
 * 安全编译带有额外变量的表达式
 */
export function safeCompileExpressionWithVars<T extends (...args: unknown[]) => number>(
  expr: string,
  argNames: string[],
  fallback: T
): T {
  if (!expr || expr.trim() === '') {
    return fallback;
  }

  const validation = validateExpression(expr);
  if (!validation.valid) {
    console.warn(`Expression validation failed: ${validation.error}. Expression: "${expr}"`);
    return fallback;
  }

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...argNames, `"use strict"; return ${expr};`) as T;
    return fn;
  } catch (e) {
    console.warn(`Failed to compile expression "${expr}":`, e);
    return fallback;
  }
}
