
import React, { useState, useEffect, useCallback } from 'react';
import EpicycleVisualizer from './components/EpicycleVisualizer';
import ControlPanel from './components/ControlPanel';
import { AppMode, Complex, MathLayer } from './types';
import { PRESETS } from './constants/presets';
import { generateFromFunction, resamplePath } from './utils/math';
import { extractContourFromImage } from './utils/imageProcessing';
import { generateCharacterImage } from './services/gemini';
import { PRESET_URIS } from './utils/presetShapes';
import { 
  Activity, 
  Loader2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.FUNCTION);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data State
  const [pathsData, setPathsData] = useState<Complex[][]>([]);
  
  // Layer Configuration State
  const [activeLayers, setActiveLayers] = useState<MathLayer[]>([{
    xFn: PRESETS.ROYAL_MANDALA.layers![0].xFn,
    yFn: PRESETS.ROYAL_MANDALA.layers![0].yFn,
    colorHex: '#22d3ee',
    lineWidth: 2,
    opacity: 1,
    ampModFn: '1'
  }]);
  
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  const [tMin, setTMin] = useState(PRESETS.ROYAL_MANDALA.tMin);
  const [tMax, setTMax] = useState(PRESETS.ROYAL_MANDALA.tMax);
  const [scale, setScale] = useState(PRESETS.ROYAL_MANDALA.scale);
  const [pointCount, setPointCount] = useState(2048); 
  
  const [currentPresetKey, setCurrentPresetKey] = useState<string>('ROYAL_MANDALA');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
      loadPreset('ROYAL_MANDALA');
  }, []);

  const handleManualRender = useCallback(() => {
    setMode(AppMode.FUNCTION);
    setLoading(true);
    setIsRunning(false);
    setErrorMsg(null);
    setCurrentPresetKey('CUSTOM');

    setTimeout(() => {
        try {
            const newPaths: Complex[][] = activeLayers.map(layer => {
                const s = layer.scaleMod ? scale * layer.scaleMod : scale;
                const data = generateFromFunction(layer.xFn, layer.yFn, tMin, tMax, pointCount, s, true);
                if (data.length === 0) throw new Error("A layer produced an empty path.");
                return data;
            });
            setPathsData(newPaths);
            setIsRunning(true);
        } catch (err) {
            setErrorMsg("Math Error: Check your function syntax in layers.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, 50);
  }, [activeLayers, tMin, tMax, pointCount, scale]);

  const loadPreset = (key: string) => {
      const p = PRESETS[key];
      setCurrentPresetKey(key);
      setTMin(p.tMin);
      setTMax(p.tMax);
      setScale(p.scale);
      
      setLoading(true);
      setIsRunning(false);
      
      setTimeout(() => {
          try {
              const newPaths: Complex[][] = [];
              const newLayers: MathLayer[] = [];

              if (p.layers) {
                  p.layers.forEach(layer => {
                      const s = layer.scaleMod ? p.scale * layer.scaleMod : p.scale;
                      const data = generateFromFunction(layer.xFn, layer.yFn, p.tMin, p.tMax, 2048, s, false);
                      if (data.length > 0) {
                          newPaths.push(data);
                          newLayers.push({ ...layer, ampModFn: layer.ampModFn || '1' });
                      }
                  });
              } else if (p.xFn && p.yFn) {
                  const data = generateFromFunction(p.xFn, p.yFn, p.tMin, p.tMax, 2048, p.scale, false);
                  newPaths.push(data);
                  newLayers.push({ 
                      xFn: p.xFn, 
                      yFn: p.yFn, 
                      colorHex: '#22d3ee', 
                      opacity: 1, 
                      lineWidth: 2,
                      ampModFn: '1'
                  });
              }
              
              setPathsData(newPaths);
              setActiveLayers(newLayers);
              setIsRunning(true);
              setMode(AppMode.FUNCTION);
          } catch(e) {
              console.error(e);
              setErrorMsg("Error generating preset.");
          } finally {
              setLoading(false);
          }
      }, 100);
  };

  const addLayer = () => {
    setActiveLayers([...activeLayers, {
        xFn: '5 * Math.cos(t)',
        yFn: '5 * Math.sin(t)',
        colorHex: '#f43f5e',
        lineWidth: 2,
        opacity: 1,
        ampModFn: '1'
    }]);
  };

  const removeLayer = (index: number) => {
    if (activeLayers.length <= 1) return;
    const nextLayers = activeLayers.filter((_, i) => i !== index);
    setActiveLayers(nextLayers);
  };

  const updateLayer = (index: number, updates: Partial<MathLayer>) => {
    const nextLayers = [...activeLayers];
    nextLayers[index] = { ...nextLayers[index], ...updates };
    setActiveLayers(nextLayers);
  };

  const handlePracticeSample = async (key: keyof typeof PRESET_URIS) => {
      const uri = PRESET_URIS[key];
      setMode(AppMode.IMAGE_UPLOAD);
      setLoading(true);
      setErrorMsg(null);
      setIsRunning(false);
      setCurrentPresetKey(`PRACTICE_${key}`);
      
      try {
        const points = await extractContourFromImage(uri);
        if (points.length < 20) throw new Error("Could not detect a clear path.");
        const complexData = resamplePath(points, pointCount); 
        setPathsData([complexData]);
        setActiveLayers([{ 
            xFn: 'IMAGE_TRACE', 
            yFn: 'IMAGE_TRACE', 
            colorHex: '#fbbf24', 
            opacity: 1, 
            lineWidth: 3, 
            fillColor: '#fbbf2420', 
            ampModFn: "1" 
        }]); 
        setIsRunning(true);
      } catch (err) {
         setErrorMsg("Failed to load sample.");
      } finally {
        setLoading(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMode(AppMode.IMAGE_UPLOAD);
      setLoading(true);
      setErrorMsg(null);
      setIsRunning(false);
      setCurrentPresetKey('IMAGE');
      try {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
             try {
                const points = await extractContourFromImage(event.target.result as string);
                if (points.length < 20) throw new Error("Could not detect a clear path.");
                const complexData = resamplePath(points, pointCount); 
                setPathsData([complexData]);
                setActiveLayers([{ 
                    xFn: 'IMAGE_TRACE', 
                    yFn: 'IMAGE_TRACE', 
                    colorHex: '#d946ef', 
                    opacity: 1, 
                    lineWidth: 2, 
                    ampModFn: "1" 
                }]); 
                setIsRunning(true);
             } catch (err) {
                 setErrorMsg("Failed to trace contours. Try a high-contrast image.");
             }
             setLoading(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setErrorMsg("Error reading file.");
        setLoading(false);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setMode(AppMode.AI_GENERATE);
    setLoading(true);
    setErrorMsg(null);
    setIsRunning(false);
    setCurrentPresetKey('AI');
    try {
      const b64Image = await generateCharacterImage(prompt);
      const points = await extractContourFromImage(b64Image);
      if (points.length < 20) {
          throw new Error("Generated image was too complex to trace.");
      }
      const complexData = resamplePath(points, pointCount);
      setPathsData([complexData]);
      setActiveLayers([{ 
          xFn: 'AI_GEN', 
          yFn: 'AI_GEN', 
          colorHex: '#facc15', 
          opacity: 1, 
          lineWidth: 2, 
          ampModFn: "1" 
      }]); 
      setIsRunning(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#050505] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* 1. VISUALIZER LAYER (BACKGROUND) */}
      <div className={`absolute inset-0 z-0 transition-all duration-500 ease-out ${isSidebarOpen ? 'pl-[200px]' : 'pl-0'}`}>
          <EpicycleVisualizer 
              pathData={pathsData} 
              layerConfigs={activeLayers}
              isRunning={isRunning} 
              speedMultiplier={speed} 
          />
      </div>

      {/* 2. UI LAYER (FOREGROUND) */}
      
      {/* Floating Sidebar Container */}
      <div 
        className={`absolute top-4 left-4 bottom-4 z-20 w-[420px] flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'}`}
      >
        <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-zinc-800/50 bg-black/60 backdrop-blur-xl">
           <ControlPanel 
            layers={activeLayers}
            updateLayer={updateLayer}
            addLayer={addLayer}
            removeLayer={removeLayer}
            tMin={tMin} setTMin={setTMin}
            tMax={tMax} setTMax={setTMax}
            scale={scale} setScale={setScale}
            speed={speed} setSpeed={setSpeed}
            isRunning={isRunning} setIsRunning={setIsRunning}
            prompt={prompt} setPrompt={setPrompt}
            loading={loading}
            currentPresetKey={currentPresetKey}
            loadPreset={loadPreset}
            handleManualRender={handleManualRender}
            handlePracticeSample={handlePracticeSample}
            handleFileUpload={handleFileUpload}
            handleGenerate={handleGenerate}
          />
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-6 z-30 p-2 rounded-full bg-black/50 hover:bg-zinc-800/80 text-zinc-400 hover:text-white backdrop-blur-md border border-zinc-800 transition-all shadow-lg"
          style={{ left: isSidebarOpen ? '450px' : '24px' }}
      >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5"/> : <PanelLeftOpen className="w-5 h-5"/>}
      </button>

      {/* Global Status Overlay */}
      {errorMsg && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-red-950/80 border border-red-500/30 text-red-200 px-6 py-2 rounded-full text-xs backdrop-blur-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <Activity className="w-4 h-4" />
            {errorMsg}
        </div>
      )}
      
      {loading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-black/80 p-8 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                <p className="text-zinc-300 text-sm font-medium tracking-wide">Synthesizing Trajectories...</p>
                <p className="text-zinc-600 text-xs mt-2 font-mono">Calculating FFT Coefficients</p>
            </div>
        </div>
      )}

      {/* Bottom Right Info */}
      <div className="absolute bottom-6 right-8 pointer-events-none z-10 text-right opacity-80">
            <h3 className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Composition</h3>
            <p className="text-cyan-400 font-mono text-sm max-w-md truncate drop-shadow-lg">
            {PRESETS[currentPresetKey]?.label || 'Custom Multi-Layer Composition'}
            </p>
            <div className="text-[10px] text-zinc-600 mt-1 font-medium">
                Fourier Architect v2.1
            </div>
      </div>

    </div>
  );
};

export default App;
