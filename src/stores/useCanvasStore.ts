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
  resetPan: () => void;
  isOutOfBounds: () => boolean;
}

type CanvasStore = CanvasState & CanvasActions;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 50;

// Pan limits - prevent users from losing the canvas
// These are in pixels, relative to the viewport center
const MAX_PAN = 2000;

/**
 * Clamp pan value within bounds
 */
const clampPan = (value: number): number => {
  return Math.min(Math.max(value, -MAX_PAN), MAX_PAN);
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // State
  zoom: 1,
  pan: { x: 0, y: 0 },

  // Actions
  setZoom: (zoom) => {
    const clamped = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
    set({ zoom: clamped });
  },

  setPan: (pan) => set({
    pan: {
      x: clampPan(pan.x),
      y: clampPan(pan.y),
    }
  }),

  adjustZoom: (delta) => {
    const { zoom } = get();
    // Use logarithmic scaling for smoother zoom at extreme levels
    const factor = 1 + delta * 5;
    const newZoom = Math.min(Math.max(zoom * factor, MIN_ZOOM), MAX_ZOOM);
    set({ zoom: newZoom });
  },

  adjustPan: (dx, dy) => {
    const { pan } = get();
    set({
      pan: {
        x: clampPan(pan.x + dx),
        y: clampPan(pan.y + dy),
      }
    });
  },

  reset: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),

  resetPan: () => set({ pan: { x: 0, y: 0 } }),

  isOutOfBounds: () => {
    const { pan } = get();
    const threshold = MAX_PAN * 0.8; // Warn at 80% of limit
    return Math.abs(pan.x) > threshold || Math.abs(pan.y) > threshold;
  },
}));
