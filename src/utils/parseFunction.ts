/**
 * Parse Function Input Utility
 * 解析用户输入的函数字符串
 */

import type { MathLayer } from '../types';

/**
 * 解析函数输入字符串
 * 支持格式:
 * - "x=sin(t), y=cos(t)"
 * - "r=1+cos(t), θ=t" 或 "r=1+cos(t), theta=t"
 * - "sin(t), cos(t)" (简写，自动识别为 x, y)
 */
export const parseFunctionInput = (input: string): Partial<MathLayer> | null => {
  const normalized = input.trim();

  // 尝试匹配 "x=..., y=..." 格式
  const xyMatch = normalized.match(/x\s*=\s*(.+?)\s*,\s*y\s*=\s*(.+)/i);
  if (xyMatch) {
    return {
      xFn: cleanFn(xyMatch[1]),
      yFn: cleanFn(xyMatch[2]),
      isPolar: false,
    };
  }

  // 尝试匹配 "r=..., θ=..." 或 "r=..., theta=..." 格式
  const polarMatch = normalized.match(/r\s*=\s*(.+?)\s*,\s*(?:θ|theta)\s*=\s*(.+)/i);
  if (polarMatch) {
    return {
      xFn: cleanFn(polarMatch[1]), // r
      yFn: cleanFn(polarMatch[2]), // theta
      isPolar: true,
    };
  }

  // 尝试匹配简写格式 "f(t), g(t)"
  const shortMatch = normalized.match(/^(.+?)\s*,\s*(.+)$/);
  if (shortMatch) {
    return {
      xFn: cleanFn(shortMatch[1]),
      yFn: cleanFn(shortMatch[2]),
      isPolar: false,
    };
  }

  // 单个表达式 - 假设是极坐标 r
  if (normalized.includes('t')) {
    return {
      xFn: cleanFn(normalized),
      yFn: 't',
      isPolar: true,
    };
  }

  return null;
};

/**
 * 清理函数字符串，转换常见简写
 */
const cleanFn = (fn: string): string => {
  return fn
    .trim()
    // 移除末尾的逗号或分号
    .replace(/[,;]$/, '')
    // 转换 sin/cos 等简写 (如果没有 Math. 前缀)
    .replace(/(?<!Math\.)\b(sin|cos|tan|asin|acos|atan|sqrt|abs|exp|log|pow|PI|E)\b/g, 'Math.$1')
    // 转换 ^ 为 Math.pow
    .replace(/(\w+)\s*\^\s*(\d+)/g, 'Math.pow($1, $2)')
    // 转换 pi 为 Math.PI
    .replace(/\bpi\b/gi, 'Math.PI')
    // 转换 e 为 Math.E (但不是单词中的 e)
    .replace(/(?<![a-zA-Z])\be\b(?![a-zA-Z])/g, 'Math.E');
};

/**
 * 验证函数表达式是否有效
 */
export const validateFn = (fn: string): boolean => {
  try {
    // 创建一个测试函数
    const testFn = new Function('t', `return ${fn}`);
    const result = testFn(0);
    return typeof result === 'number' && isFinite(result);
  } catch {
    return false;
  }
};
