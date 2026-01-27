/**
 * Overlays Component
 * 覆盖层：Loading + Error
 */

import React from 'react';
import { Activity, Loader2, Undo2 } from 'lucide-react';
import { useDataStore } from '../../stores';

const Overlays: React.FC = () => {
  const loading = useDataStore((s) => s.loading);
  const error = useDataStore((s) => s.error);
  const resetError = useDataStore((s) => s.resetError);

  return (
    <>
      {/* Error Toast */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500/30 text-red-200 px-6 py-3 rounded-xl text-xs backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Activity className="w-4 h-4" />
          {error}
          <button onClick={resetError} className="ml-2 hover:text-white">
            <Undo2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-[#09090b] p-8 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 animate-pulse"></div>
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4 relative z-10" />
            <p className="text-zinc-300 text-sm font-medium tracking-wide relative z-10">
              信号处理中...
            </p>
            <p className="text-zinc-600 text-xs mt-2 font-mono relative z-10 uppercase tracking-widest">
              正在计算 FFT 频谱...
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Overlays;
