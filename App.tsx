
import React from 'react';
import EpicycleVisualizer from './components/EpicycleVisualizer';
import GenerativeVisualizer from './components/GenerativeVisualizer';
import ControlPanel from './components/ControlPanel';
import { PRESETS } from './constants/presets';
import { useAppState } from './hooks/useAppState';
import {
    Activity,
    Loader2,
    Play,
    Pause,
    Settings2,
    ChevronDown,
    Sigma,
    Undo2
} from 'lucide-react';

const App: React.FC = () => {
    const {
        // State
        isInspectorOpen,
        isPresetMenuOpen,
        isRunning,
        speed,
        tMin,
        tMax,
        scale,
        currentPresetKey,
        currentRenderer,
        layersConfig,
        processedLayers,
        loading,
        error,

        // Actions
        setIsInspectorOpen,
        setIsPresetMenuOpen,
        setIsRunning,
        setSpeed,
        setTMin,
        setTMax,
        setScale,
        handleLoadPreset,
        handleManualCompile,
        handleImageProcess,
        handleAIProcess,
        handleSampleProcess,
        addLayer,
        removeLayer,
        updateLayer,
        resetError,
    } = useAppState();

    return (
        <div className="relative h-screen w-full bg-[#050505] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-hidden">

            {/* 1. VISUALIZER LAYER (SWITCHABLE) */}
            <div className="absolute inset-0 z-0">
                {currentRenderer === 'PARTICLE' ? (
                    <GenerativeVisualizer
                        isRunning={isRunning}
                        speed={speed}
                    />
                ) : (
                    <EpicycleVisualizer
                        layers={processedLayers}
                        isRunning={isRunning}
                        speedMultiplier={speed}
                    />
                )}
            </div>

            {/* 2. UI: Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-6 pointer-events-none">
                <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-3 pr-5 py-2 flex items-center gap-3 shadow-xl">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Sigma className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-white leading-none">Fourier<span className="font-light text-zinc-400">Architect</span></h1>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">傅里叶绘图师 v4.0</p>
                    </div>
                </div>

                <div className="pointer-events-auto relative">
                    <button
                        onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                        className="bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-black/80 rounded-full px-4 py-2.5 flex items-center gap-3 transition-all shadow-xl group"
                    >
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-zinc-400">预设 (Preset)</span>
                        <div className="w-px h-3 bg-zinc-800"></div>
                        <span className="text-xs font-medium text-cyan-50 truncate max-w-[150px]">
                            {PRESETS[currentPresetKey]?.label.replace(/.*:/, '').trim() || '自定义 (Custom)'}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${isPresetMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPresetMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-64 bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {Object.entries(PRESETS).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleLoadPreset(key)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between group ${currentPresetKey === key ? 'bg-cyan-950/30 text-cyan-200' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                                    >
                                        <span>{val.label.replace(/.*:/, '').trim()}</span>
                                        {val.layers && <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-zinc-600 font-mono group-hover:text-zinc-400">{val.layers.length}层</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. UI: Bottom Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-4 shadow-2xl ring-1 ring-white/5 pl-6 pr-6 h-14">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className="w-10 h-10 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="w-px h-6 bg-white/10"></div>

                    <div className="flex flex-col gap-1 w-32">
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                            <span>速度 (Speed)</span>
                            <span className="text-cyan-400">{speed.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="4"
                            step="0.1"
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
                        />
                    </div>

                    <div className="w-px h-6 bg-white/10"></div>

                    <button
                        onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                        disabled={currentRenderer === 'PARTICLE'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${isInspectorOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'} ${currentRenderer === 'PARTICLE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>控制面板</span>
                    </button>
                </div>
            </div>

            {/* 4. UI: Right Inspector */}
            <div className={`absolute top-0 right-0 bottom-0 w-[380px] z-30 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isInspectorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <ControlPanel
                    layers={layersConfig}
                    tMin={tMin} setTMin={setTMin}
                    tMax={tMax} setTMax={setTMax}
                    scale={scale} setScale={setScale}
                    loading={loading}

                    updateLayer={updateLayer}
                    addLayer={addLayer}
                    removeLayer={removeLayer}

                    onCompileFunctions={handleManualCompile}
                    onProcessImage={handleImageProcess}
                    onProcessAI={handleAIProcess}
                    onProcessSample={handleSampleProcess}

                    onClose={() => setIsInspectorOpen(false)}
                />
            </div>

            {/* 5. Overlays */}
            {error && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500/30 text-red-200 px-6 py-3 rounded-xl text-xs backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <Activity className="w-4 h-4" />
                    {error}
                    <button onClick={resetError} className="ml-2 hover:text-white"><Undo2 className="w-3 h-3" /></button>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="bg-[#09090b] p-8 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 animate-pulse"></div>
                        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4 relative z-10" />
                        <p className="text-zinc-300 text-sm font-medium tracking-wide relative z-10">信号处理中...</p>
                        <p className="text-zinc-600 text-xs mt-2 font-mono relative z-10 uppercase tracking-widest">正在计算 FFT 频谱...</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;
