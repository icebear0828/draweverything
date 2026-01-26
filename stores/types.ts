/**
 * Store Type Definitions
 * 共享于所有 Store 的类型定义
 */

import { Complex, MathLayer, ProcessedLayer, ParticleFormula, PresetDef } from '../types';
import { PRESET_URIS } from '../utils/presetShapes';

// ============================================
// UI Store Types
// ============================================

export interface UIState {
  isInspectorOpen: boolean;
  isPresetMenuOpen: boolean;
  activeTab: 'MATH' | 'IMAGE' | 'AI';
}

export interface UIActions {
  setInspectorOpen: (open: boolean) => void;
  setPresetMenuOpen: (open: boolean) => void;
  setActiveTab: (tab: 'MATH' | 'IMAGE' | 'AI') => void;
  toggleInspector: () => void;
  togglePresetMenu: () => void;
  closeAllPanels: () => void;
}

export type UIStore = UIState & UIActions;

// ============================================
// Simulation Store Types
// ============================================

export interface SimulationState {
  isRunning: boolean;
  speed: number;
  pointCount: number;
}

export interface SimulationActions {
  setRunning: (running: boolean) => void;
  setSpeed: (speed: number) => void;
  pause: () => void;
  resume: () => void;
}

export type SimulationStore = SimulationState & SimulationActions;

// ============================================
// Config Store Types
// ============================================

export interface ConfigState {
  tMin: number;
  tMax: number;
  scale: number;
  currentPresetKey: string;
  currentRenderer: 'FOURIER' | 'PARTICLE';
  particleFormula: ParticleFormula | undefined;
}

export interface ConfigActions {
  setTMin: (val: number) => void;
  setTMax: (val: number) => void;
  setScale: (val: number) => void;
  setPresetKey: (key: string) => void;
  setRenderer: (renderer: 'FOURIER' | 'PARTICLE') => void;
  setParticleFormula: (formula: ParticleFormula | undefined) => void;
  applyPresetConfig: (presetKey: string) => {
    tMin: number;
    tMax: number;
    scale: number;
    renderer: 'FOURIER' | 'PARTICLE';
    particle?: ParticleFormula;
  } | null;
}

export type ConfigStore = ConfigState & ConfigActions;

// ============================================
// Data Store Types
// ============================================

export interface DataState {
  pathsData: Complex[][];
  layersConfig: MathLayer[];
  processedLayers: ProcessedLayer[];
  loading: boolean;
  error: string | null;
}

export interface DataActions {
  setPathsData: (paths: Complex[][]) => void;
  setLayersConfig: (layers: MathLayer[]) => void;
  setProcessedLayers: (layers: ProcessedLayer[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetError: () => void;

  // Layer Management
  addLayer: () => void;
  removeLayer: (index: number) => void;
  updateLayer: (index: number, updates: Partial<MathLayer>) => void;

  // Data Generation Actions
  compileFunctions: (tMin: number, tMax: number, scale: number, points: number) => void;
  loadPreset: (key: string) => Promise<void>;
  processImage: (file: File, pointCount: number) => Promise<void>;
  processAI: (prompt: string, pointCount: number) => Promise<void>;
  processSample: (key: keyof typeof PRESET_URIS, pointCount: number) => Promise<void>;
}

export type DataStore = DataState & DataActions;

// ============================================
// Combined App Store Type (optional)
// ============================================

export interface AppStore {
  ui: UIStore;
  simulation: SimulationStore;
  config: ConfigStore;
  data: DataStore;
}
