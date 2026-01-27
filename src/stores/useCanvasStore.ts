/**
 * Canvas Store - 管理共享的画布控制状态
 *
 * 职责：
 * - 缩放 (zoom)
 * - 平移 (pan)
 * - 让多个可视化组件共享同一个视图状态
 */

import { create } from 'zustand';

interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
}

interface CanvasActions {
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  adjustZoom: (delta: number) => void;
  adjustPan: (dx: number, dy: number) => void;
  reset: () => void;
}

type CanvasStore = CanvasState & CanvasActions;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 50;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // State
  zoom: 1,
  pan: { x: 0, y: 0 },

  // Actions
  setZoom: (zoom) => {
    const clamped = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
    set({ zoom: clamped });
  },

  setPan: (pan) => set({ pan }),

  adjustZoom: (delta) => {
    const { zoom } = get();
    const newZoom = Math.min(Math.max(zoom + delta * zoom * 5, MIN_ZOOM), MAX_ZOOM);
    set({ zoom: newZoom });
  },

  adjustPan: (dx, dy) => {
    const { pan } = get();
    set({ pan: { x: pan.x + dx, y: pan.y + dy } });
  },

  reset: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
}));
