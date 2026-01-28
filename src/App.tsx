
import { useEffect, useCallback, useMemo, type FC } from 'react';
import EpicycleVisualizer from './components/EpicycleVisualizer';
import MultiSystemParticleRenderer from './components/MultiSystemParticleRenderer';
import ControlPanel from './components/ControlPanel';
import { convertLegacyFormula } from './utils/particle';
import { ENGINE_THEME } from './constants/config';
import ErrorBoundary from './components/ErrorBoundary';
import Layout, { BottomBar, Overlays } from './components/Layout';
import TopSection from './components/TopSection';
import {
    useUIStore,
    useSimulationStore,
    useConfigStore,
    useDataStore,
    useLayerStore
} from './stores';
import { useAppHandlers } from './hooks/useAppHandlers';
import { parseFunctionInput } from './utils/parseFunction';

const App: FC = () => {
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
    const showParticle = useConfigStore(s => s.showParticle);
    const showFourier = useConfigStore(s => s.showFourier);
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

    // Convert legacy particle formula to new expression system
    const particleSystem = useMemo(() => {
        if (!particleFormula) return undefined;
        return convertLegacyFormula(particleFormula);
    }, [particleFormula]);

    // 处理函数输入
    const handleFunctionInput = useCallback((input: string) => {
        const parsed = parseFunctionInput(input);
        if (parsed && parsed.xFn && parsed.yFn) {
            // 更新图层配置
            updateLayer(0, {
                xFn: parsed.xFn,
                yFn: parsed.yFn,
                isPolar: parsed.isPolar,
            });
            // 触发编译
            handleManualCompile();
        }
    }, [updateLayer, handleManualCompile]);

    // --- Initial Load ---
    useEffect(() => {
        handleLoadPreset('ALIEN_SIGNAL');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Layout>
            {/* 0. 背景层 */}
            <div className="absolute inset-0 z-0" style={{ backgroundColor: ENGINE_THEME.background }} />

            {/* 1. VISUALIZER LAYERS (可叠加显示) */}
            {/* 粒子层 - 作为背景 */}
            {showParticle && particleSystem && (
                <div className="absolute inset-0 z-[1]">
                    <ErrorBoundary>
                        <MultiSystemParticleRenderer
                            isRunning={isRunning}
                            speed={speed}
                            system={particleSystem}
                        />
                    </ErrorBoundary>
                </div>
            )}
            {/* FFT 层 - 作为前景 (叠加时透明) */}
            {showFourier && processedLayers.length > 0 && (
                <div className="absolute inset-0 z-[2]">
                    <ErrorBoundary>
                        <EpicycleVisualizer
                            layers={processedLayers}
                            isRunning={isRunning}
                            speedMultiplier={speed}
                            transparent={showParticle}
                        />
                    </ErrorBoundary>
                </div>
            )}

            {/* 2. UI: Top Section (CommandBar + PresetPanel) */}
            <TopSection
                onLoadPreset={handleLoadPreset}
                onSubmitFunction={handleFunctionInput}
                onSubmitAI={handleAIProcess}
                onOpenSettings={() => setInspectorOpen(true)}
            />

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
