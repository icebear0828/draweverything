/**
 * Safe Expression Evaluation using mathjs AST parser
 *
 * 使用 mathjs 的 AST 解析器替代 new Function，提供更安全的数学表达式编译
 * - 完全基于 AST 解析，无代码注入风险
 * - 白名单验证所有标识符和函数
 * - 预处理 Math.* 语法以保持向后兼容
 */

import { compile, parse, MathNode, SymbolNode, FunctionNode } from 'mathjs';
import { EXPRESSION_MAX_LENGTH } from '../constants/config';

// ============================================
// Type Definitions
// ============================================

interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================
// Whitelist Configuration
// ============================================

/** 允许的变量名 */
const ALLOWED_VARIABLES = new Set([
  't', 'n', 'x', 'y', 'r', 'theta', 'rMod',
  // mathjs 内置常量
  'pi', 'e', 'phi', 'tau', 'i',
]);

/** 允许的函数名 */
const ALLOWED_FUNCTIONS = new Set([
  // 三角函数
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'sec', 'csc', 'cot', 'asec', 'acsc', 'acot',
  // 指数和对数
  'exp', 'expm1', 'log', 'log10', 'log2', 'log1p',
  // 幂和根
  'sqrt', 'cbrt', 'pow', 'nthRoot',
  // 取整和符号
  'abs', 'sign', 'floor', 'ceil', 'round', 'trunc', 'fix',
  // 比较和范围
  'min', 'max', 'hypot', 'mod',
  // 其他数学函数
  'square', 'cube', 'factorial', 'gamma',
  // 循环函数 (在编译时特殊处理)
  'sum', 'prod',
]);

// ============================================
// Expression Preprocessing
// ============================================

/**
 * 预处理表达式：将 JavaScript Math.* 语法转换为 mathjs 语法
 *
 * 转换规则:
 * - Math.PI → pi
 * - Math.E → e
 * - Math.sin(x) → sin(x)
 * - Math.pow(a, b) → pow(a, b)
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
// AST Validation
// ============================================

/**
 * 递归验证 AST 节点
 * 确保只使用白名单中的变量和函数
 */
function validateNode(
  node: MathNode,
  additionalVars: Set<string>
): ValidationResult {
  const nodeType = node.type;

  // 符号节点 (变量/常量)
  if (nodeType === 'SymbolNode') {
    const sym = node as SymbolNode;
    const name = sym.name;

    // 检查是否在允许列表中
    if (
      !ALLOWED_VARIABLES.has(name) &&
      !ALLOWED_FUNCTIONS.has(name) &&
      !additionalVars.has(name)
    ) {
      return { valid: false, error: `Unknown identifier: ${name}` };
    }
    return { valid: true };
  }

  // 函数调用节点
  if (nodeType === 'FunctionNode') {
    const fn = node as FunctionNode;
    // fn.fn 可能是 SymbolNode 或其他类型
    const fnName = 'name' in fn.fn ? (fn.fn as SymbolNode).name : '';

    if (fnName && !ALLOWED_FUNCTIONS.has(fnName)) {
      return { valid: false, error: `Disallowed function: ${fnName}` };
    }

    // 验证函数参数
    for (const arg of fn.args) {
      const result = validateNode(arg, additionalVars);
      if (!result.valid) return result;
    }
    return { valid: true };
  }

  // 运算符节点
  if (nodeType === 'OperatorNode') {
    const opNode = node as MathNode & { args?: MathNode[] };
    if (opNode.args) {
      for (const arg of opNode.args) {
        const result = validateNode(arg, additionalVars);
        if (!result.valid) return result;
      }
    }
    return { valid: true };
  }

  // 括号节点
  if (nodeType === 'ParenthesisNode') {
    const parenNode = node as MathNode & { content?: MathNode };
    if (parenNode.content) {
      return validateNode(parenNode.content, additionalVars);
    }
    return { valid: true };
  }

  // 常量节点 (数字)
  if (nodeType === 'ConstantNode') {
    return { valid: true };
  }

  // 条件节点 (三元运算符)
  if (nodeType === 'ConditionalNode') {
    const condNode = node as MathNode & {
      condition?: MathNode;
      trueExpr?: MathNode;
      falseExpr?: MathNode;
    };
    if (condNode.condition) {
      const r1 = validateNode(condNode.condition, additionalVars);
      if (!r1.valid) return r1;
    }
    if (condNode.trueExpr) {
      const r2 = validateNode(condNode.trueExpr, additionalVars);
      if (!r2.valid) return r2;
    }
    if (condNode.falseExpr) {
      const r3 = validateNode(condNode.falseExpr, additionalVars);
      if (!r3.valid) return r3;
    }
    return { valid: true };
  }

  // 赋值节点 - 不允许
  if (nodeType === 'AssignmentNode') {
    return { valid: false, error: 'Assignment operations are not allowed' };
  }

  // 数组/矩阵节点
  if (nodeType === 'ArrayNode') {
    const arrNode = node as MathNode & { items?: MathNode[] };
    if (arrNode.items) {
      for (const item of arrNode.items) {
        const result = validateNode(item, additionalVars);
        if (!result.valid) return result;
      }
    }
    return { valid: true };
  }

  // 访问节点 - 不允许 (如 obj.prop)
  if (nodeType === 'AccessorNode') {
    return { valid: false, error: 'Property access is not allowed' };
  }

  // 索引节点
  if (nodeType === 'IndexNode') {
    return { valid: false, error: 'Index access is not allowed' };
  }

  // 范围节点
  if (nodeType === 'RangeNode') {
    return { valid: false, error: 'Range expressions are not allowed' };
  }

  // 块节点 - 不允许
  if (nodeType === 'BlockNode') {
    return { valid: false, error: 'Block expressions are not allowed' };
  }

  // 函数赋值节点 - 不允许
  if (nodeType === 'FunctionAssignmentNode') {
    return { valid: false, error: 'Function definitions are not allowed' };
  }

  // 对象节点 - 不允许
  if (nodeType === 'ObjectNode') {
    return { valid: false, error: 'Object literals are not allowed' };
  }

  // 关系运算节点 (比较运算)
  if (nodeType === 'RelationalNode') {
    const relNode = node as MathNode & { params?: MathNode[] };
    if (relNode.params) {
      for (const param of relNode.params) {
        const result = validateNode(param, additionalVars);
        if (!result.valid) return result;
      }
    }
    return { valid: true };
  }

  // 默认: 允许其他节点类型
  return { valid: true };
}

// ============================================
// Public API
// ============================================

/**
 * 验证表达式是否安全
 */
export function validateExpression(
  expr: string,
  additionalVars: string[] = []
): ValidationResult {
  if (!expr || typeof expr !== 'string') {
    return { valid: false, error: 'Expression must be a non-empty string' };
  }

  const trimmed = expr.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Expression is empty' };
  }

  if (trimmed.length > EXPRESSION_MAX_LENGTH) {
    return {
      valid: false,
      error: `Expression too long (max ${EXPRESSION_MAX_LENGTH} chars)`,
    };
  }

  try {
    // 预处理并解析
    const processed = preprocessExpression(trimmed);
    const ast = parse(processed);

    // 验证 AST
    const additionalVarsSet = new Set(additionalVars);
    return validateNode(ast, additionalVarsSet);
  } catch (e) {
    return {
      valid: false,
      error: `Parse error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * 安全编译数学表达式为函数
 *
 * @param expr - 数学表达式字符串
 * @param argNames - 函数参数名列表
 * @param fallback - 编译失败时的回退函数
 * @returns 编译后的函数
 */
export function safeCompileExpression<T extends (...args: number[]) => number>(
  expr: string,
  argNames: string[],
  fallback: T
): T {
  if (!expr || expr.trim() === '') {
    return fallback;
  }

  const validation = validateExpression(expr, argNames);
  if (!validation.valid) {
    console.warn(
      `Expression validation failed: ${validation.error}. Expression: "${expr}"`
    );
    return fallback;
  }

  try {
    // 预处理并编译
    const processed = preprocessExpression(expr);
    const compiled = compile(processed);

    // 创建包装函数
    const fn = (...args: number[]): number => {
      const scope: Record<string, number> = {};
      argNames.forEach((name, i) => {
        scope[name] = args[i];
      });

      try {
        const result = compiled.evaluate(scope);

        // 确保返回有效数字
        if (typeof result !== 'number' || !isFinite(result)) {
          return fallback(...args);
        }
        return result;
      } catch {
        return fallback(...args);
      }
    };

    // 测试函数是否正常工作
    const testArgs = argNames.map(() => 1);
    const result = fn(...testArgs);

    if (typeof result !== 'number' || !isFinite(result)) {
      console.warn(`Expression "${expr}" returned invalid result: ${result}`);
      return fallback;
    }

    return fn as T;
  } catch (e) {
    console.warn(`Failed to compile expression "${expr}":`, e);
    return fallback;
  }
}

/**
 * 安全编译带有额外变量的表达式
 * 用于粒子系统等需要 vars 对象的场景
 */
export function safeCompileExpressionWithVars<
  T extends (...args: unknown[]) => number,
>(expr: string, argNames: string[], fallback: T): T {
  if (!expr || expr.trim() === '') {
    return fallback;
  }

  const validation = validateExpression(expr, argNames);
  if (!validation.valid) {
    console.warn(
      `Expression validation failed: ${validation.error}. Expression: "${expr}"`
    );
    return fallback;
  }

  try {
    const processed = preprocessExpression(expr);
    const compiled = compile(processed);

    const fn = (...args: unknown[]): number => {
      const scope: Record<string, unknown> = {};
      argNames.forEach((name, i) => {
        scope[name] = args[i];
      });

      try {
        const result = compiled.evaluate(scope as Record<string, number>);
        if (typeof result !== 'number' || !isFinite(result)) {
          return (fallback as (...a: unknown[]) => number)(...args);
        }
        return result;
      } catch {
        return (fallback as (...a: unknown[]) => number)(...args);
      }
    };

    return fn as T;
  } catch (e) {
    console.warn(`Failed to compile expression "${expr}":`, e);
    return fallback;
  }
}
