/**
 * ErrorBoundary Component
 * React 错误边界，捕获子组件渲染错误
 */

import { Component, type ErrorInfo, type ReactNode, type FC } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ENGINE_THEME } from '../constants/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default error fallback UI
 */
const ErrorFallback: FC<{
  error: Error | null;
  onReset: () => void;
}> = ({ error, onReset }) => (
  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: ENGINE_THEME.background }}>
    <div className="bg-[#09090b] p-8 rounded-3xl border border-red-500/30 shadow-2xl flex flex-col items-center max-w-md">
      <div className="bg-red-950/50 p-4 rounded-full mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-red-200 mb-2">渲染错误</h2>
      <p className="text-sm text-zinc-400 text-center mb-4">
        可视化组件遇到了问题，请尝试重新加载
      </p>
      {error && (
        <div className="w-full bg-black/40 rounded-lg p-3 mb-4 overflow-auto max-h-32">
          <code className="text-[10px] text-red-300 font-mono break-all">
            {error.message}
          </code>
        </div>
      )}
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 bg-red-950/50 hover:bg-red-900/50 border border-red-500/30 rounded-lg text-red-200 text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        重新加载
      </button>
    </div>
  </div>
);

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
