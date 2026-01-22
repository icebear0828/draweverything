
import React, { useState, useCallback } from 'react';
import { Complex, MathLayer, PresetDef } from '../types';
import { generateFromFunction, resamplePath } from '../utils/math';
import { extractContourFromImage } from '../utils/imageProcessing';
import { generateCharacterImage } from '../services/gemini';
import { PRESETS } from '../constants/presets';
import { PRESET_URIS } from '../utils/presetShapes';

interface UsePathGeneratorResult {
  pathsData: Complex[][];
  layersConfig: MathLayer[];
  loading: boolean;
  error: string | null;
  resetError: () => void;
  
  // Actions
  compileFunctions: (layers: MathLayer[], tMin: number, tMax: number, scale: number, points: number) => void;
  loadPreset: (key: string) => Promise<PresetDef | null>;
  processImage: (file: File, pointCount: number) => Promise<void>;
  processAI: (prompt: string, pointCount: number) => Promise<void>;
  processSample: (key: keyof typeof PRESET_URIS, pointCount: number) => Promise<void>;
  setLayersConfig: React.Dispatch<React.SetStateAction<MathLayer[]>>;
}

export const usePathGenerator = (): UsePathGeneratorResult => {
  const [pathsData, setPathsData] = useState<Complex[][]>([]);
  const [layersConfig, setLayersConfig] = useState<MathLayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = () => setError(null);

  // Strategy 1: Math Functions
  const compileFunctions = useCallback((layers: MathLayer[], tMin: number, tMax: number, scale: number, points: number) => {
    setLoading(true);
    setError(null);
    
    // Use setTimeout to allow UI to render the loading state before heavy calculation
    setTimeout(() => {
        try {
            const newPaths: Complex[][] = layers.map(layer => {
                const s = layer.scaleMod ? scale * layer.scaleMod : scale;
                // Center only if it's a manual function layer to ensure it stays on screen
                const data = generateFromFunction(layer.xFn, layer.yFn, tMin, tMax, points, s, true, layer.isPolar);
                if (data.length === 0) throw new Error("Layer produced empty path. Check syntax.");
                return data;
            });
            setPathsData(newPaths);
            setLayersConfig(layers);
        } catch (err: any) {
            setError(err.message || "Math compilation failed.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, 50);
  }, []);

  // Strategy 2: Presets
  const loadPreset = useCallback(async (key: string): Promise<PresetDef | null> => {
      const p = PRESETS[key];
      if (!p) return null;

      setLoading(true);
      setError(null);
      
      return new Promise<PresetDef>((resolve) => {
        setTimeout(() => {
            try {
                const newPaths: Complex[][] = [];
                const newLayers: MathLayer[] = [];

                if (p.layers) {
                    p.layers.forEach(layer => {
                        const s = layer.scaleMod ? p.scale * layer.scaleMod : p.scale;
                        const data = generateFromFunction(layer.xFn, layer.yFn, p.tMin, p.tMax, 2048, s, false, layer.isPolar);
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
                setLayersConfig(newLayers);
                resolve(p);
            } catch(e) {
                console.error(e);
                setError("Error generating preset.");
            } finally {
                setLoading(false);
            }
        }, 50);
      });
  }, []);

  // Strategy 3: Image Upload
  const processImage = useCallback(async (file: File, pointCount: number) => {
    setLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        if (event.target?.result) {
            try {
                const points = await extractContourFromImage(event.target.result as string);
                if (points.length < 20) throw new Error("Could not detect a clear path.");
                const complexData = resamplePath(points, pointCount); 
                
                setPathsData([complexData]);
                setLayersConfig([{ 
                    xFn: 'IMAGE_TRACE', 
                    yFn: 'IMAGE_TRACE', 
                    colorHex: '#d946ef', 
                    opacity: 1, 
                    lineWidth: 2, 
                    ampModFn: "1" 
                }]);
            } catch (err: any) {
                setError(err.message || "Failed to trace contours.");
            } finally {
                setLoading(false);
            }
        }
    };
    reader.readAsDataURL(file);
  }, []);

  // Strategy 4: AI Generation
  const processAI = useCallback(async (prompt: string, pointCount: number) => {
      setLoading(true);
      setError(null);
      try {
        const b64Image = await generateCharacterImage(prompt);
        const points = await extractContourFromImage(b64Image);
        if (points.length < 20) throw new Error("Generated image was too complex to trace.");
        
        const complexData = resamplePath(points, pointCount);
        setPathsData([complexData]);
        setLayersConfig([{ 
            xFn: 'AI_GEN', 
            yFn: 'AI_GEN', 
            colorHex: '#facc15', 
            opacity: 1, 
            lineWidth: 2, 
            ampModFn: "1" 
        }]); 
      } catch (err: any) {
        setError(err.message || "AI Generation failed.");
      } finally {
        setLoading(false);
      }
  }, []);

  // Strategy 5: Static Samples
  const processSample = useCallback(async (key: keyof typeof PRESET_URIS, pointCount: number) => {
    setLoading(true);
    setError(null);
    try {
        const uri = PRESET_URIS[key];
        const points = await extractContourFromImage(uri);
        if (points.length < 20) throw new Error("Could not detect a clear path.");
        const complexData = resamplePath(points, pointCount); 
        setPathsData([complexData]);
        setLayersConfig([{ 
            xFn: 'IMAGE_TRACE', 
            yFn: 'IMAGE_TRACE', 
            colorHex: '#fbbf24', 
            opacity: 1, 
            lineWidth: 3, 
            fillColor: '#fbbf2420', 
            ampModFn: "1" 
        }]); 
    } catch (err: any) {
         setError("Failed to load sample.");
    } finally {
        setLoading(false);
    }
  }, []);

  return {
      pathsData,
      layersConfig,
      loading,
      error,
      resetError,
      compileFunctions,
      loadPreset,
      processImage,
      processAI,
      processSample,
      setLayersConfig
  };
};
