import React, { useState, useEffect, useCallback } from 'react';
import { MathLayer } from '../types';
import { PRESETS } from '../constants/presets';
import { usePathGenerator } from './usePathGenerator';
import { useFourier } from './useFourier';

export interface AppState {
    // UI State
    isInspectorOpen: boolean;
    isPresetMenuOpen: boolean;

    // Simulation State
    isRunning: boolean;
    speed: number;
    pointCount: number;

    // Config State
    tMin: number;
    tMax: number;
    scale: number;
    currentPresetKey: string;
    currentRenderer: 'FOURIER' | 'PARTICLE';

    // Data State
    pathsData: import('../types').Complex[][];
    layersConfig: MathLayer[];
    processedLayers: import('../types').ProcessedLayer[];
    loading: boolean;
    error: string | null;
}

export interface AppActions {
    // UI Actions
    setIsInspectorOpen: (open: boolean) => void;
    setIsPresetMenuOpen: (open: boolean) => void;

    // Simulation Actions
    setIsRunning: (running: boolean) => void;
    setSpeed: (speed: number) => void;

    // Config Actions
    setTMin: (val: number) => void;
    setTMax: (val: number) => void;
    setScale: (val: number) => void;

    // Handler Actions
    handleLoadPreset: (key: string) => Promise<void>;
    handleManualCompile: () => void;
    handleImageProcess: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleAIProcess: (prompt: string) => Promise<void>;
    handleSampleProcess: (key: any) => Promise<void>;

    // Layer Actions
    addLayer: () => void;
    removeLayer: (index: number) => void;
    updateLayer: (index: number, updates: Partial<MathLayer>) => void;

    // Error Actions
    resetError: () => void;
}

export type UseAppStateResult = AppState & AppActions;

export const useAppState = (): UseAppStateResult => {
    // --- UI State ---
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);

    // --- Simulation State ---
    const [isRunning, setIsRunning] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [pointCount] = useState(2048);

    // --- Data Generator ---
    const generator = usePathGenerator();
    const {
        pathsData,
        layersConfig,
        loading,
        error,
        resetError,
        setLayersConfig
    } = generator;

    // --- Signal Processing ---
    const processedLayers = useFourier(pathsData, layersConfig);

    // --- Config State ---
    const [tMin, setTMin] = useState(PRESETS.ALIEN_SIGNAL.tMin);
    const [tMax, setTMax] = useState(PRESETS.ALIEN_SIGNAL.tMax);
    const [scale, setScale] = useState(PRESETS.ALIEN_SIGNAL.scale);
    const [currentPresetKey, setCurrentPresetKey] = useState<string>('ALIEN_SIGNAL');
    const [currentRenderer, setCurrentRenderer] = useState<'FOURIER' | 'PARTICLE'>('PARTICLE');

    // --- Initial Load ---
    useEffect(() => {
        handleLoadPreset('ALIEN_SIGNAL');
    }, []);

    // --- Handlers ---

    const handleLoadPreset = useCallback(async (key: string) => {
        setIsRunning(false);
        setIsPresetMenuOpen(false);
        setCurrentPresetKey(key);
        const preset = PRESETS[key];

        setCurrentRenderer(preset.renderer || 'FOURIER');

        if (preset.renderer === 'PARTICLE') {
            setTMin(preset.tMin);
            setTMax(preset.tMax);
            setScale(preset.scale);
            setIsRunning(true);
            return;
        }

        const loadedPreset = await generator.loadPreset(key);
        if (loadedPreset) {
            setTMin(loadedPreset.tMin);
            setTMax(loadedPreset.tMax);
            setScale(loadedPreset.scale);
            setIsRunning(true);
        }
    }, [generator]);

    const handleManualCompile = useCallback(() => {
        setIsRunning(false);
        setCurrentPresetKey('CUSTOM');
        setCurrentRenderer('FOURIER');
        generator.compileFunctions(layersConfig, tMin, tMax, scale, pointCount);
        setIsRunning(true);
    }, [generator, layersConfig, tMin, tMax, scale, pointCount]);

    const handleImageProcess = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setIsRunning(false);
        setCurrentPresetKey('IMAGE');
        setCurrentRenderer('FOURIER');
        await generator.processImage(e.target.files[0], pointCount);
        setIsRunning(true);
    }, [generator, pointCount]);

    const handleAIProcess = useCallback(async (prompt: string) => {
        setIsRunning(false);
        setCurrentPresetKey('AI');
        setCurrentRenderer('FOURIER');
        await generator.processAI(prompt, pointCount);
        setIsRunning(true);
    }, [generator, pointCount]);

    const handleSampleProcess = useCallback(async (key: any) => {
        setIsRunning(false);
        setCurrentPresetKey(`SAMPLE_${key}`);
        setCurrentRenderer('FOURIER');
        await generator.processSample(key, pointCount);
        setIsRunning(true);
    }, [generator, pointCount]);

    // --- Layer Management ---

    const addLayer = useCallback(() => {
        setLayersConfig([...layersConfig, {
            xFn: '5 * Math.cos(t)',
            yFn: '5 * Math.sin(t)',
            colorHex: '#f43f5e',
            lineWidth: 2,
            opacity: 1,
            ampModFn: '1'
        }]);
    }, [layersConfig, setLayersConfig]);

    const removeLayer = useCallback((index: number) => {
        if (layersConfig.length <= 1) return;
        const nextLayers = layersConfig.filter((_, i) => i !== index);
        setLayersConfig(nextLayers);
    }, [layersConfig, setLayersConfig]);

    const updateLayer = useCallback((index: number, updates: Partial<MathLayer>) => {
        const nextLayers = [...layersConfig];
        nextLayers[index] = { ...nextLayers[index], ...updates };
        setLayersConfig(nextLayers);
    }, [layersConfig, setLayersConfig]);

    return {
        // State
        isInspectorOpen,
        isPresetMenuOpen,
        isRunning,
        speed,
        pointCount,
        tMin,
        tMax,
        scale,
        currentPresetKey,
        currentRenderer,
        pathsData,
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
    };
};
