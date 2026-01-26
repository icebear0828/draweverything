
import React, { useEffect, useCallback } from 'react';
import EpicycleVisualizer from './components/EpicycleVisualizer';
import GenerativeVisualizer from './components/GenerativeVisualizer';
import ControlPanel from './components/ControlPanel';
import ErrorBoundary from './components/ErrorBoundary';
import Layout, { TopBar, BottomBar, Overlays } from './components/Layout';
import {
    useUIStore,
    useSimulationStore,
    useConfigStore,
    useDataStore
} from './stores';

const App: React.FC = () => {
    // UI Store
    const isInspectorOpen = useUIStore(s => s.isInspectorOpen);
    const setInspectorOpen = useUIStore(s => s.setInspectorOpen);
    const setPresetMenuOpen = useUIStore(s => s.setPresetMenuOpen);

    // Simulation Store
    const isRunning = useSimulationStore(s => s.isRunning);
    const speed = useSimulationStore(s => s.speed);
    const pointCount = useSimulationStore(s => s.pointCount);
    const pause = useSimulationStore(s => s.pause);
    const resume = useSimulationStore(s => s.resume);

    // Config Store
    const tMin = useConfigStore(s => s.tMin);
    const tMax = useConfigStore(s => s.tMax);
    const scale = useConfigStore(s => s.scale);
    const currentRenderer = useConfigStore(s => s.currentRenderer);
    const particleFormula = useConfigStore(s => s.particleFormula);
    const setTMin = useConfigStore(s => s.setTMin);
    const setTMax = useConfigStore(s => s.setTMax);
    const setScale = useConfigStore(s => s.setScale);
    const applyPresetConfig = useConfigStore(s => s.applyPresetConfig);

    // Data Store
    const layersConfig = useDataStore(s => s.layersConfig);
    const processedLayers = useDataStore(s => s.processedLayers);
    const loading = useDataStore(s => s.loading);
    const addLayer = useDataStore(s => s.addLayer);
    const removeLayer = useDataStore(s => s.removeLayer);
    const updateLayer = useDataStore(s => s.updateLayer);
    const compileFunctions = useDataStore(s => s.compileFunctions);
    const loadPreset = useDataStore(s => s.loadPreset);
    const processImage = useDataStore(s => s.processImage);
    const processAI = useDataStore(s => s.processAI);
    const processSample = useDataStore(s => s.processSample);

    // --- Initial Load ---
    useEffect(() => {
        handleLoadPreset('ALIEN_SIGNAL');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Handlers ---
    const handleLoadPreset = useCallback(async (key: string) => {
        pause();
        setPresetMenuOpen(false);

        const presetConfig = applyPresetConfig(key);
        if (!presetConfig) return;

        if (presetConfig.renderer === 'PARTICLE') {
            resume();
            return;
        }

        await loadPreset(key);
        resume();
    }, [pause, setPresetMenuOpen, applyPresetConfig, resume, loadPreset]);

    const handleManualCompile = useCallback(() => {
        pause();
        applyPresetConfig('CUSTOM');
        compileFunctions(tMin, tMax, scale, pointCount);
        resume();
    }, [pause, applyPresetConfig, compileFunctions, tMin, tMax, scale, pointCount, resume]);

    const handleImageProcess = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        pause();
        applyPresetConfig('IMAGE');
        await processImage(e.target.files[0], pointCount);
        resume();
    }, [pause, applyPresetConfig, processImage, pointCount, resume]);

    const handleAIProcess = useCallback(async (prompt: string) => {
        pause();
        applyPresetConfig('AI');
        await processAI(prompt, pointCount);
        resume();
    }, [pause, applyPresetConfig, processAI, pointCount, resume]);

    const handleSampleProcess = useCallback(async (key: 'PIKACHU' | 'DORAEMON') => {
        pause();
        applyPresetConfig(`SAMPLE_${key}`);
        await processSample(key, pointCount);
        resume();
    }, [pause, applyPresetConfig, processSample, pointCount, resume]);

    return (
        <Layout>
            {/* 1. VISUALIZER LAYER (SWITCHABLE) */}
            <div className="absolute inset-0 z-0">
                <ErrorBoundary>
                    {currentRenderer === 'PARTICLE' ? (
                        <GenerativeVisualizer
                            isRunning={isRunning}
                            speed={speed}
                            formula={particleFormula}
                        />
                    ) : (
                        <EpicycleVisualizer
                            layers={processedLayers}
                            isRunning={isRunning}
                            speedMultiplier={speed}
                        />
                    )}
                </ErrorBoundary>
            </div>

            {/* 2. UI: Top Bar */}
            <TopBar onLoadPreset={handleLoadPreset} />

            {/* 3. UI: Bottom Bar */}
            <BottomBar />

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

                    onClose={() => setInspectorOpen(false)}
                />
            </div>

            {/* 5. Overlays */}
            <Overlays />
        </Layout>
    );
};

export default App;
