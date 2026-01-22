
import { useState, useEffect, useMemo } from 'react';
import { Complex, MathLayer, ProcessedLayer, FourierCoefficient } from '../types';
import { dft } from '../utils/math';

export const useFourier = (pathsData: Complex[][], layerConfigs: MathLayer[]) => {
    // 1. Heavy Computation: Only re-calculate DFT when geometry (pathsData) changes.
    // This assumes pathsData[i] reference changes only when data changes.
    const dftResults = useMemo(() => {
        if (pathsData.length === 0) return [];
        return pathsData.map(path => dft(path));
    }, [pathsData]);

    // 2. Lightweight Computation: Merge DFT results with styling/config.
    // This runs whenever styling changes (fast) without blocking UI.
    const processedLayers = useMemo(() => {
        if (dftResults.length === 0 || layerConfigs.length === 0) {
            return [];
        }

        return dftResults.map((coeffs, index) => {
            const config = layerConfigs[index] || layerConfigs[0]; // Fallback
            
            // Compile Modulation Function safely
            let modFn = (t: number) => 1;
            if (config.ampModFn) {
                try {
                    // eslint-disable-next-line no-new-func
                    modFn = new Function('t', `return ${config.ampModFn};`) as (t: number) => number;
                } catch (e) {
                    // console.warn("Invalid modulation function, defaulting to 1", e);
                }
            }
            
            return {
                id: `layer-${index}`, // Stable ID based on index to preserve history
                coefficients: coeffs,
                color: config.colorHex,
                fillColor: config.fillColor,
                opacity: config.opacity ?? 1.0,
                lineWidth: config.lineWidth ?? 2.0,
                modFn
            };
        });
    }, [dftResults, layerConfigs]);

    return processedLayers;
};
