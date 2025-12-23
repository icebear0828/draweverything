
import React, { useState } from 'react';
import { 
  Calculator, 
  RefreshCw, 
  Upload, 
  Wand2, 
  Settings2,
  Trash2,
  Plus,
  Image as ImageIcon,
  X,
  ChevronRight,
  PencilRuler
} from 'lucide-react';
import { MathLayer } from '../types';
import { PRESET_URIS } from '../utils/presetShapes';

interface ControlPanelProps {
  // Data
  layers: MathLayer[];
  tMin: number;
  tMax: number;
  scale: number;
  loading: boolean;
  
  // Actions
  updateLayer: (index: number, updates: Partial<MathLayer>) => void;
  addLayer: () => void;
  removeLayer: (index: number) => void;
  setTMin: (val: number) => void;
  setTMax: (val: number) => void;
  setScale: (val: number) => void;
  
  // Generators
  onCompileFunctions: () => void;
  onProcessImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessAI: (prompt: string) => void;
  onProcessSample: (key: keyof typeof PRESET_URIS) => void;
  
  onClose: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  layers, tMin, tMax, scale, loading,
  updateLayer, addLayer, removeLayer, 
  setTMin, setTMax, setScale,
  onCompileFunctions, onProcessImage, onProcessAI, onProcessSample,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'MATH' | 'IMAGE' | 'AI'>('MATH');
  const [expandedLayer, setExpandedLayer] = useState<number | null>(0);
  const [prompt, setPrompt] = useState('');

  return (
    <div className="w-full h-full flex flex-col bg-[#09090b]/90 backdrop-blur-xl border-l border-white/10 shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-cyan-400" />
          Architect Inspector
        </h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 mx-5 mt-4 bg-black/40 rounded-lg border border-white/5">
        <button 
          onClick={() => setActiveTab('MATH')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'MATH' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Calculator className="w-3 h-3" /> Function
        </button>
        <button 
          onClick={() => setActiveTab('IMAGE')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'IMAGE' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <ImageIcon className="w-3 h-3" /> Picture
        </button>
        <button 
          onClick={() => setActiveTab('AI')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'AI' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Wand2 className="w-3 h-3" /> Character
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        
        {/* --- MATH TAB --- */}
        {activeTab === 'MATH' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Global Settings */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest pl-1">Start (t)</label>
                <input type="number" value={tMin} onChange={e => setTMin(parseFloat(e.target.value))} className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest pl-1">End (t)</label>
                <input type="number" value={tMax} onChange={e => setTMax(parseFloat(e.target.value))} className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest pl-1">Scale</label>
                <input type="number" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full bg-zinc-900/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none" />
              </div>
            </div>

            {/* Layers List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Equation Layers</h3>
                <button onClick={addLayer} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold uppercase hover:bg-cyan-950/30 px-2 py-1 rounded transition-all">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {layers.map((layer, idx) => (
                <div key={idx} className={`bg-zinc-900/30 border rounded-lg overflow-hidden transition-all duration-300 ${expandedLayer === idx ? 'border-cyan-500/30 shadow-[0_0_15px_-5px_rgba(34,211,238,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
                  {/* Layer Header */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer select-none bg-white/0 hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedLayer(expandedLayer === idx ? null : idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.colorHex, boxShadow: `0 0 8px ${layer.colorHex}` }} />
                      <span className="text-xs font-mono text-zinc-300">
                        {layer.xFn === 'AI_GEN' ? 'AI Generated' : layer.xFn === 'IMAGE_TRACE' ? 'Image Trace' : `Trajectory ${idx + 1}`}
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
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-mono pl-1">x(t) =</label>
                        <textarea 
                          value={layer.xFn}
                          onChange={(e) => updateLayer(idx, { xFn: e.target.value })}
                          disabled={layer.xFn === 'AI_GEN' || layer.xFn === 'IMAGE_TRACE'}
                          className={`w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono text-cyan-100 focus:border-cyan-500/50 focus:outline-none h-14 resize-none leading-relaxed ${layer.xFn === 'AI_GEN' || layer.xFn === 'IMAGE_TRACE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          spellCheck={false}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-mono pl-1">y(t) =</label>
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
                          <label className="text-[9px] text-zinc-500 pl-1">Color</label>
                          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded p-1">
                            <input type="color" value={layer.colorHex} onChange={(e) => updateLayer(idx, { colorHex: e.target.value })} className="w-5 h-5 bg-transparent cursor-pointer rounded overflow-hidden" />
                            <span className="text-[9px] font-mono text-zinc-400 uppercase">{layer.colorHex}</span>
                          </div>
                        </div>
                         <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500 pl-1">Line Width</label>
                            <input type="number" step="0.5" value={layer.lineWidth} onChange={(e) => updateLayer(idx, { lineWidth: parseFloat(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-zinc-300" />
                         </div>
                      </div>

                      <div className="space-y-1">
                         <label className="text-[9px] text-zinc-500 font-mono pl-1 flex items-center gap-1">
                            <PencilRuler className="w-2 h-2" /> Radius Mod.
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
              Generate Trajectory
            </button>
          </div>
        )}

        {/* --- IMAGE TAB --- */}
        {activeTab === 'IMAGE' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-4 bg-zinc-900/30 border border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-zinc-800/30 hover:border-zinc-500 transition-all group cursor-pointer relative">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={onProcessImage} />
                  <div className="p-3 bg-zinc-900 rounded-full border border-white/10 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                  </div>
                  <div className="text-center space-y-1">
                      <p className="text-xs font-medium text-zinc-300">Import Picture</p>
                      <p className="text-[10px] text-zinc-600">Trace FFT contours from PNG/JPG</p>
                  </div>
              </div>

              <div>
                  <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">Or Try Sample</h3>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => onProcessSample('PIKACHU')} className="h-16 bg-zinc-900/50 border border-white/5 hover:border-yellow-500/50 hover:bg-yellow-500/10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all group">
                          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-yellow-200">#025</span>
                          <span className="text-[9px] text-zinc-600 uppercase">Pikachu</span>
                      </button>
                      <button onClick={() => onProcessSample('DORAEMON')} className="h-16 bg-zinc-900/50 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all group">
                          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-blue-200">#Robot</span>
                          <span className="text-[9px] text-zinc-600 uppercase">Doraemon</span>
                      </button>
                  </div>
              </div>
           </div>
        )}

        {/* --- AI TAB --- */}
        {activeTab === 'AI' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-3">
                   <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Input Character Description</label>
                   <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. A cyberpunk cat, a minimalist rose..."
                      className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-lg p-3 text-xs text-zinc-200 focus:border-purple-500/50 focus:outline-none resize-none"
                   />
               </div>

               <button 
                  onClick={() => onProcessAI(prompt)}
                  disabled={loading || !prompt.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/20 rounded-lg text-xs font-bold text-purple-100 tracking-wide uppercase shadow-lg hover:shadow-purple-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
               >
                  {loading ? (
                     <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                     <Wand2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  )}
                  {loading ? 'Synthesizing...' : 'Generate FFT Drawing'}
               </button>
               
               <p className="text-[10px] text-zinc-600 leading-relaxed text-center px-2">
                   Powered by Gemini 2.5 Flash. 
               </p>
           </div>
        )}

      </div>
    </div>
  );
};

export default ControlPanel;
