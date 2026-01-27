/**
 * CommandBar Component
 * 统一输入入口 - 支持函数输入和自然语言 AI 生成
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Code, X, Loader2 } from 'lucide-react';

type InputMode = 'function' | 'ai';

interface CommandBarProps {
  onSubmitFunction: (input: string) => void;
  onSubmitAI: (prompt: string) => void;
  loading?: boolean;
  placeholder?: string;
}

const CommandBar: React.FC<CommandBarProps> = ({
  onSubmitFunction,
  onSubmitAI,
  loading = false,
  placeholder = '输入函数 x=sin(t), y=cos(t) 或用自然语言描述...'
}) => {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState<InputMode>('function');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 快捷键 Ctrl+K 聚焦
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // ESC 取消聚焦
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;

    if (mode === 'ai') {
      onSubmitAI(value.trim());
    } else {
      onSubmitFunction(value.trim());
    }
  };

  const handleClear = () => {
    setValue('');
    inputRef.current?.focus();
  };

  // 智能检测输入模式
  const detectMode = (input: string): InputMode => {
    // 如果包含数学表达式特征，认为是函数模式
    const mathPatterns = /^[xyrθ]\s*=|Math\.|sin|cos|tan|pow|\*|\/|\+|-|\^/i;
    if (mathPatterns.test(input)) {
      return 'function';
    }
    // 否则认为是自然语言
    if (input.length > 10 && !/[=\*\/\^]/.test(input)) {
      return 'ai';
    }
    return mode; // 保持当前模式
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    // 自动检测模式
    if (newValue.length > 3) {
      setMode(detectMode(newValue));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative flex items-center gap-2
          bg-black/60 backdrop-blur-xl
          border rounded-2xl
          transition-all duration-300
          ${isFocused
            ? 'border-white/30 ring-2 ring-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
            : 'border-white/10 hover:border-white/20'
          }
        `}
      >
        {/* 模式切换按钮 */}
        <div className="flex items-center gap-1 pl-4">
          <button
            type="button"
            onClick={() => setMode('function')}
            className={`
              p-2 rounded-lg transition-all
              ${mode === 'function'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }
            `}
            title="函数模式"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`
              p-2 rounded-lg transition-all
              ${mode === 'ai'
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }
            `}
            title="AI 生成模式"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={loading}
          className="
            flex-1 bg-transparent py-4 pr-4
            text-white placeholder-zinc-500
            outline-none text-sm
          "
        />

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2 pr-4">
          {/* 清除按钮 */}
          {value && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* 加载中 */}
          {loading && (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          )}

          {/* 快捷键提示 */}
          {!isFocused && !value && (
            <kbd className="px-2 py-1 text-[10px] text-zinc-500 bg-white/5 rounded border border-white/10">
              ⌘K
            </kbd>
          )}

          {/* 提交按钮 */}
          {value && !loading && (
            <button
              type="submit"
              className={`
                px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-200
                ${mode === 'ai'
                  ? 'bg-purple-500 hover:bg-purple-400 text-white'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                }
              `}
            >
              {mode === 'ai' ? '生成' : '绘制'}
            </button>
          )}
        </div>
      </div>

      {/* 模式提示 */}
      <div className="mt-2 flex justify-center">
        <span className="text-[10px] text-zinc-600">
          {mode === 'ai' ? (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI 将根据描述生成图形
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Code className="w-3 h-3" />
              支持格式: x=f(t), y=g(t) 或 r=f(t), θ=g(t)
            </span>
          )}
        </span>
      </div>
    </form>
  );
};

export default CommandBar;
