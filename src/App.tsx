
import React, { useEffect } from 'react';
import EpicycleVisualizer from './components/EpicycleVisualizer';
import GenerativeVisualizer from './components/GenerativeVisualizer';
import ControlPanel from './components/ControlPanel';
import ErrorBoundary from './components/ErrorBoundary';
import Layout, { TopBar, BottomBar, Overlays } from './components/Layout';
import {
    useUIStore,
    useSimulationStore,
    useConfigStore,
    useDataStore,
    useLayerStore
} from './stores';
import { useAppHandlers } from './hooks/useAppHandlers';

const App: React.FC = () => {
    // UI Store
    const isInspectorOpen = useUIStore(s => s.isInspectorOpen);
    const setInspectorOpen = useUIStore(s => s.setInspectorOpen);

    // Simulation Store
    const isRunning = useSimulationStore(s => s.isRunning);
    const speed = useSimulationStore(s => s.speed);

    // Config Store
    const tMin = useConfigStore(s => s.tMin);
    const tMax = useConfigStore(s => s.tMax);
    const scale = useConfigStore(s => s.scale);
    const currentRenderer = useConfigStore(s => s.currentRenderer);
    const particleFormula = useConfigStore(s => s.particleFormula);
    const setTMin = useConfigStore(s => s.setTMin);
    const setTMax = useConfigStore(s => s.setTMax);
    const setScale = useConfigStore(s => s.setScale);

    // Data Store
    const processedLayers = useDataStore(s => s.processedLayers);
    const loading = useDataStore(s => s.loading);

    // Layer Store
    const layersConfig = useLayerStore(s => s.layersConfig);
    const addLayer = useLayerStore(s => s.addLayer);
    const removeLayer = useLayerStore(s => s.removeLayer);
    const updateLayer = useLayerStore(s => s.updateLayer);

    // Business Logic Handlers (extracted to custom hook)
    const {
        handleLoadPreset,
        handleManualCompile,
        handleImageProcess,
        handleAIProcess,
        handleSampleProcess,
    } = useAppHandlers();

    // --- Initial Load ---
    useEffect(() => {
        handleLoadPreset('ALIEN_SIGNAL');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
