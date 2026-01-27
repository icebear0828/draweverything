import React from 'react';
import {
    RefreshCw,
    ChevronRight,
    PencilRuler,
    Globe,
    Grid,
    Trash2,
    Plus
} from 'lucide-react';
import { MathLayer } from '../../types';

interface MathTabProps {
    layers: MathLayer[];
    tMin: number;
    tMax: number;
    scale: number;
    expandedLayer: number | null;
    setExpandedLayer: (idx: number | null) => void;
    updateLayer: (index: number, updates: Partial<MathLayer>) => void;
    addLayer: () => void;
    removeLayer: (index: number) => void;
    setTMin: (val: number) => void;
    setTMax: (val: number) => void;
    setScale: (val: number) => void;
    onCompileFunctions: () => void;
}

const MathTab: React.FC<MathTabProps> = ({
    layers,
    tMin,
    tMax,
    scale,
    expandedLayer,
    setExpandedLayer,
    updateLayer,
    addLayer,
    removeLayer,
    setTMin,
    setTMax,
    setScale,
    onCompileFunctions,
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Global Settings */}
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest pl-1">起点 (t)</label>
                    <input
                        type="number"
                        value={tMin}
                        onChange={e => setTMin(parseFloat(e.target.value))}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest pl-1">终点 (t)</label>
                    <input
                        type="number"
                        value={tMax}
                        onChange={e => setTMax(parseFloat(e.target.value))}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest pl-1">缩放 (Scale)</label>
                    <input
                        type="number"
                        value={scale}
                        onChange={e => setScale(parseFloat(e.target.value))}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none"
                    />
                </div>
            </div>

            {/* Layers List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">方程图层 (Equation Layers)</h3>
                    <button
                        onClick={addLayer}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold uppercase hover:bg-cyan-950/30 px-2 py-1 rounded transition-all"
                    >
                        <Plus className="w-3 h-3" /> 添加
                    </button>
                </div>

                {layers.map((layer, idx) => (
                    <div
                        key={idx}
                        className={`bg-zinc-900/30 border rounded-lg overflow-hidden transition-all duration-300 ${expandedLayer === idx ? 'border-cyan-500/30 shadow-[0_0_15px_-5px_rgba(34,211,238,0.1)]' : 'border-white/5 hover:border-white/10'}`}
                    >
                        {/* Layer Header */}
                        <div
                            className="flex items-center justify-between p-3 cursor-pointer select-none bg-white/0 hover:bg-white/5 transition-colors"
                            onClick={() => setExpandedLayer(expandedLayer === idx ? null : idx)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.colorHex, boxShadow: `0 0 8px ${layer.colorHex}` }} />
                                <span className="text-xs font-mono text-zinc-300">
                                    {layer.xFn === 'AI_GEN' ? 'AI 自动生成路径' : layer.xFn === 'IMAGE_TRACE' ? '图片轮廓追踪' : `轨迹层 ${idx + 1}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); removeLayer(idx); }} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                                <ChevronRight className={`w-3 h-3 text-zinc-600 transition-transform duration-300 ${expandedLayer === idx ? 'rotate-90' : ''}`} />
                            </div>
                        </div>

                        {/* Layer Details */}
                        {expandedLayer === idx && (
                            <div className="p-3 pt-0 space-y-3 border-t border-white/5 mt-1">
                                {/* Coord System Toggle */}
                                <div className="flex justify-between items-center bg-black/20 rounded p-1 mb-2">
                                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest pl-1">坐标系 (System)</label>
                                    <button
                                        onClick={() => updateLayer(idx, { isPolar: !layer.isPolar })}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${layer.isPolar ? 'bg-indigo-900/50 text-indigo-200' : 'bg-zinc-800 text-zinc-400'}`}
                                    >
                                        {layer.isPolar ? <Globe className="w-3 h-3" /> : <Grid className="w-3 h-3" />}
                                        {layer.isPolar ? '极坐标 (r, θ)' : '笛卡尔 (x, y)'}
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 font-mono pl-1 text-cyan-200/80">{layer.isPolar ? 'r(t) =' : 'x(t) ='}</label>
                                    <textarea
                                        value={layer.xFn}
                                        onChange={(e) => updateLayer(idx, { xFn: e.target.value })}
                                        disabled={layer.xFn === 'AI_GEN' || layer.xFn === 'IMAGE_TRACE'}
                                        className={`w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none h-14 resize-none leading-relaxed ${layer.xFn === 'AI_GEN' || layer.xFn === 'IMAGE_TRACE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        spellCheck={false}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 font-mono pl-1 text-cyan-200/80">{layer.isPolar ? 'θ(t) =' : 'y(t) ='}</label>
                                    <textarea
                                        value={layer.yFn}
                                        onChange={(e) => updateLayer(idx, { yFn: e.target.value })}
                                        disabled={layer.yFn === 'AI_GEN' || layer.yFn === 'IMAGE_TRACE'}
                                        className={`w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none h-14 resize-none leading-relaxed ${layer.yFn === 'AI_GEN' || layer.yFn === 'IMAGE_TRACE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        spellCheck={false}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 pl-1">颜色 (Color)</label>
                                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded p-1">
                                            <input type="color" value={layer.colorHex} onChange={(e) => updateLayer(idx, { colorHex: e.target.value })} className="w-5 h-5 bg-transparent cursor-pointer rounded overflow-hidden" />
                                            <span className="text-[9px] font-mono text-zinc-400 uppercase">{layer.colorHex}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-zinc-500 pl-1">线宽 (Width)</label>
                                        <input type="number" step="0.5" value={layer.lineWidth} onChange={(e) => updateLayer(idx, { lineWidth: parseFloat(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-zinc-300" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 font-mono pl-1 flex items-center gap-1">
                                        <PencilRuler className="w-2 h-2" /> 振幅/半径调制 (Mod)
                                    </label>
                                    <input type="text" value={layer.ampModFn} onChange={(e) => updateLayer(idx, { ampModFn: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-yellow-100/80 focus:border-yellow-500/50 focus:outline-none" placeholder="1" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={onCompileFunctions}
                className="w-full py-3 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/20 rounded-lg text-xs font-bold text-cyan-100 tracking-wide uppercase shadow-lg hover:shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 group"
            >
                <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                生成轨迹 (Generate)
            </button>
        </div>
    );
};

export default MathTab;
