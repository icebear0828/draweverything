
import React, { useState, useRef, useEffect } from 'react';
import { 
  Calculator, 
  ChevronDown, 
  Layers, 
  RefreshCw, 
  Upload, 
  Wand2, 
  Sigma,
  Gamepad2,
  Pause,
  Play,
  Activity,
  Plus,
  Trash2,
  Settings2,
  ChevronRight
} from 'lucide-react';
import { PRESETS } from '../constants/presets';
import { PRESET_URIS } from '../utils/presetShapes';
import { MathLayer } from '../types';

interface ControlPanelProps {
  layers: MathLayer[];
  updateLayer: (index: number, updates: Partial<MathLayer>) => void;
  addLayer: () => void;
  removeLayer: (index: number) => void;
  tMin: number;
  setTMin: (val: number) => void;
  tMax: number;
  setTMax: (val: number) => void;
  scale: number;
  setScale: (val: number) => void;
  speed: number;
  setSpeed: (val: number) => void;
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
  prompt: string;
  setPrompt: (val: string) => void;
  loading: boolean;
  currentPresetKey: string;
  loadPreset: (key: string) => void;
  handleManualRender: () => void;
  handlePracticeSample: (key: keyof typeof PRESET_URIS) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerate: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  layers, updateLayer, addLayer, removeLayer,
  tMin, setTMin, tMax, setTMax, scale, setScale,
  speed, setSpeed, isRunning, setIsRunning, prompt, setPrompt, loading,
  currentPresetKey, loadPreset, handleManualRender, 
  handlePracticeSample, handleFileUpload, handleGenerate
}) => {
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState<number | null>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPresetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onPresetSelect = (key: string) => {
    loadPreset(key);
    setIsPresetMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full p-6 overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="pb-5 border-b border-zinc-800/50 mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tighter">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
            <Sigma className="text-cyan-400 w-5 h-5" />
          </div>
          Fourier<span className="text-zinc-500 font-light">Architect</span>
        </h1>
      </div>

      {/* Global Config Section */}
      <section className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Settings2 className="w-3 h-3" />
              Global Config
            </h2>
            
            <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                  className={`text-[10px] bg-zinc-800/50 hover:bg-zinc-700/50 px-3 py-1.5 rounded-md flex items-center gap-2 transition-all border border-zinc-700/30 text-zinc-300 hover:text-white ${isPresetMenuOpen ? 'bg-zinc-700/80 text-white' : ''}`}
                >
                   Load Preset <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isPresetMenuOpen ? 'rotate-180' : ''}`}/>
                </button>
                
                {isPresetMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[500px] overflow-y-auto custom-scrollbar ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-100">
                      {Object.entries(PRESETS).map(([key, val]) => (
                          <button 
                            key={key} 
                            onClick={() => onPresetSelect(key)}
                            className="w-full text-left px-5 py-3 text-xs hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors border-b border-zinc-800/50 last:border-0 flex flex-col group/item"
                          >
                              <span className="font-medium flex items-center gap-2 text-zinc-200 group-hover/item:text-cyan-200">
                                {val.label}
                                {val.layers && <Layers className="w-3 h-3 text-zinc-600 group-hover/item:text-cyan-500" />}
                              </span>
                          </button>
                      ))}
                  </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-zinc-900/30 p-4 rounded-xl border border-white/5">
             <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider pl-1">t Start</label>
                <input type="number" value={tMin} onChange={e => setTMin(parseFloat(e.target.value))} className="w-full bg-black/40 border border-zinc-800 rounded-md px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-500/50" />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider pl-1">t End</label>
                <input type="number" value={tMax} onChange={e => setTMax(parseFloat(e.target.value))} className="w-full bg-black/40 border border-zinc-800 rounded-md px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-500/50" />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider pl-1">Global Scale</label>
                <input type="number" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full bg-black/40 border border-zinc-800 rounded-md px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-500/50" />
             </div>
        </div>
      </section>

      {/* Layers Manager Section */}
      <section className="space-y-4 mb-8">
        <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3 h-3" />
              Layers Manager
            </h2>
            <button 
              onClick={addLayer}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold uppercase transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Layer
            </button>
        </div>

        <div className="space-y-3">
          {layers.map((layer, idx) => (
            <div key={idx} className={`bg-zinc-900/40 border rounded-xl overflow-hidden transition-all duration-200 ${expandedLayer === idx ? 'border-zinc-600/50 ring-1 ring-white/5' : 'border-zinc-800 hover:border-zinc-700'}`}>
              <div 
                className="flex items-center justify-between p-3 cursor-pointer select-none"
                onClick={() => setExpandedLayer(expandedLayer === idx ? null : idx)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: layer.colorHex, backgroundColor: layer.colorHex }}></div>
                  <span className="text-[11px] font-mono text-zinc-400">Layer {idx + 1}</span>
                  <span className="text-[10px] text-zinc-600 truncate max-w-[120px] font-mono">{layer.xFn.substring(0, 15)}...</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeLayer(idx); }}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${expandedLayer === idx ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {expandedLayer === idx && (
                <div className="p-4 pt-0 space-y-4 border-t border-zinc-800/50 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase pl-1">x(t)</label>
                    <textarea 
                      value={layer.xFn}
                      onChange={(e) => updateLayer(idx, { xFn: e.target.value })}
                      className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-[11px] font-mono text-zinc-200 focus:border-cyan-500/50 focus:outline-none h-16 resize-none leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase pl-1">y(t)</label>
                    <textarea 
                      value={layer.yFn}
                      onChange={(e) => updateLayer(idx, { yFn: e.target.value })}
                      className="w-full bg-black/40 border border-zinc-800 rounded-lg p-2.5 text-[11px] font-mono text-zinc-200 focus:border-cyan-500/50 focus:outline-none h-16 resize-none leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase pl-1">Color</label>
                        <div className="flex gap-2 items-center">
                           <input 
                             type="color" 
                             value={layer.colorHex} 
                             onChange={(e) => updateLayer(idx, { colorHex: e.target.value })}
                             className="w-8 h-8 bg-transparent cursor-pointer rounded overflow-hidden"
                           />
                           <input 
                             type="text" 
                             value={layer.colorHex} 
                             onChange={(e) => updateLayer(idx, { colorHex: e.target.value })}
                             className="flex-1 bg-black/40 border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-400"
                           />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase pl-1">Width</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={layer.lineWidth} 
                          onChange={(e) => updateLayer(idx, { lineWidth: parseFloat(e.target.value) })}
                          className="w-full bg-black/40 border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-400"
                        />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase pl-1 flex items-center gap-1.5">
                       <Activity className="w-2.5 h-2.5" /> Amp Modulation
                    </label>
                    <input 
                      type="text"
                      value={layer.ampModFn}
                      onChange={(e) => updateLayer(idx, { ampModFn: e.target.value })}
                      className="w-full bg-black/40 border border-zinc-800 rounded px-3 py-2 text-[10px] font-mono text-cyan-300 focus:border-cyan-500/50 focus:outline-none"
                      spellCheck={false}
                      placeholder="e.g. 1 + 0.2*Math.sin(t)"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={handleManualRender}
          className="w-full py-3 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-800/30 text-cyan-200 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-Compute All Layers
        </button>
      </section>

      {/* Secondary Inputs */}
      <div className="border-t border-zinc-800/50 pt-6 space-y-6">
           {/* Practice Samples */}
           <div>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Gamepad2 className="w-3 h-3" />
                  Load Sample
              </h3>
              <div className="grid grid-cols-2 gap-3">
                  <button 
                      onClick={() => handlePracticeSample('PIKACHU')}
                      className="px-3 py-3 bg-zinc-900/40 border border-zinc-800 hover:bg-yellow-500/10 hover:border-yellow-500/50 hover:text-yellow-200 rounded-lg transition-all text-[10px] text-zinc-400 font-medium tracking-wide"
                  >
                      #025 Pikachu
                  </button>
                  <button 
                      onClick={() => handlePracticeSample('DORAEMON')}
                      className="px-3 py-3 bg-zinc-900/40 border border-zinc-800 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-200 rounded-lg transition-all text-[10px] text-zinc-400 font-medium tracking-wide"
                  >
                      #Cat Robot
                  </button>
              </div>
           </div>

           {/* AI & Upload */}
          <div className="space-y-3">
               <label className="flex items-center justify-center gap-2 px-3 py-3 bg-zinc-800/30 hover:bg-zinc-700/40 rounded-lg cursor-pointer transition-all text-xs text-zinc-400 hover:text-white border border-dashed border-zinc-700 hover:border-zinc-500 group">
                  <Upload className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Import Image for Analysis</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>

               <div className="relative group">
                  <input 
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Or describe a shape for Gemini AI..."
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-xs focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-zinc-600"
                  />
                  <button 
                      onClick={handleGenerate}
                      disabled={loading || !prompt}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-zinc-800 hover:bg-cyan-900/50 text-zinc-400 hover:text-cyan-300 rounded-md text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                      <Wand2 className="w-3.5 h-3.5" />
                  </button>
               </div>
          </div>
      </div>

      {/* Footer Controls */}
      <section className="mt-auto pt-6 border-t border-zinc-800/50">
         <div className="flex items-center justify-between mb-3">
             <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Playback Speed</span>
             <span className="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/50">{speed.toFixed(1)}x</span>
         </div>
         <input 
           type="range" 
           min="0.1" 
           max="5" 
           step="0.1" 
           value={speed}
           onChange={(e) => setSpeed(parseFloat(e.target.value))}
           className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
         />
         
         <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all font-medium shadow-lg
              ${isRunning 
                  ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50' 
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-transparent hover:brightness-110'}`}
            >
                {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isRunning ? 'Pause' : 'Resume'}
         </button>
      </section>
    </div>
  );
};

export default ControlPanel;
