
import { useState, useEffect, useMemo } from 'react';
import { Complex, MathLayer, ProcessedLayer } from '../types';
import { dft } from '../utils/math';

export const useFourier = (pathsData: Complex[][], layerConfigs: MathLayer[]) => {
    const [processedLayers, setProcessedLayers] = useState<ProcessedLayer[]>([]);

    useEffect(() => {
        if (pathsData.length === 0 || layerConfigs.length === 0) {
            setProcessedLayers([]);
            return;
        }

        const newLayers: ProcessedLayer[] = pathsData.map((path, index) => {
            // 1. Compute DFT
            const coeffs = dft(path);
            const config = layerConfigs[index] || layerConfigs[0]; // Fallback
            
            // 2. Compile Modulation Function safely
            let modFn = (t: number) => 1;
            if (config.ampModFn) {
                try {
                    // eslint-disable-next-line no-new-func
                    modFn = new Function('t', `return ${config.ampModFn};`) as (t: number) => number;
                } catch (e) {
                    console.warn("Invalid modulation function, defaulting to 1", e);
                }
            }
            
            return {
                id: `layer-${index}-${Date.now()}`,
                coefficients: coeffs,
                color: config.colorHex,
                fillColor: config.fillColor,
                opacity: config.opacity ?? 1.0,
                lineWidth: config.lineWidth ?? 2.0,
                modFn
            };
        });

        setProcessedLayers(newLayers);

    }, [pathsData, layerConfigs]); 
    // We intentionally depend on layerConfigs so if color changes, we re-emit the layer object.
    // However, DFT is expensive. In a production app, we would split DFT calc from config merge.
    // For this size, it is acceptable, or we could use useMemo on the DFT part specifically.

    return processedLayers;
};
