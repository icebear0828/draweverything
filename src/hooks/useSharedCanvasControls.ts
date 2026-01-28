/**
 * useSharedCanvasControls Hook
 * 使用共享的 canvas store，让多个可视化组件同步缩放/平移
 * 支持鼠标和触摸事件
 */

import { useRef, useCallback, useEffect, type MutableRefObject, type MouseEvent, type TouchEvent } from 'react';
import { useCanvasStore } from '../stores/useCanvasStore';

const ZOOM_SENSITIVITY = 0.001;
const PINCH_ZOOM_SENSITIVITY = 0.01;

export interface SharedCanvasControlsResult {
  // State (from store)
  zoom: number;
  pan: { x: number; y: number };

  // Refs for animation loop access (synced with store)
  zoomRef: MutableRefObject<number>;
  panRef: MutableRefObject<{ x: number; y: number }>;

  // Mouse Handlers
  handleMouseDown: (e: MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
  handleDoubleClick: () => void;

  // Touch Handlers
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: () => void;

  // Wheel setup
  setupWheelHandler: (canvas: HTMLCanvasElement | null) => (() => void) | undefined;

  // Keyboard setup
  setupKeyboardHandler: () => (() => void) | undefined;
}

/**
 * Calculate distance between two touch points
 */
const getTouchDistance = (touches: React.TouchList): number => {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Get center point of two touches
 */
const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
  if (touches.length < 2) {
    return { x: touches[0].clientX, y: touches[0].clientY };
  }
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
};

export const useSharedCanvasControls = (): SharedCanvasControlsResult => {
  // Get state and actions from store
  const zoom = useCanvasStore((s) => s.zoom);
  const pan = useCanvasStore((s) => s.pan);
  const adjustZoom = useCanvasStore((s) => s.adjustZoom);
  const adjustPan = useCanvasStore((s) => s.adjustPan);
  const reset = useCanvasStore((s) => s.reset);

  // Refs for animation loop (synced with store state)
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  // Sync refs with store state
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // Drag state (local to this hook instance, but affects shared store)
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Touch state
  const lastTouchDistance = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });
  const touchCount = useRef(0);

  // Mouse Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    adjustPan(dx, dy);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [adjustPan]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Touch Handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchCount.current = e.touches.length;

    if (e.touches.length === 1) {
      // Single touch - prepare for pan
      isDragging.current = true;
      lastTouchCenter.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      isDragging.current = true;
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;

    if (e.touches.length === 1 && touchCount.current === 1) {
      // Single touch - pan
      const dx = e.touches[0].clientX - lastTouchCenter.current.x;
      const dy = e.touches[0].clientY - lastTouchCenter.current.y;
      adjustPan(dx, dy);
      lastTouchCenter.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom and pan
      const currentDistance = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches);

      // Zoom based on pinch distance change
      if (lastTouchDistance.current > 0) {
        const distanceDelta = currentDistance - lastTouchDistance.current;
        const zoomDelta = distanceDelta * PINCH_ZOOM_SENSITIVITY;
        adjustZoom(zoomDelta);
      }

      // Pan based on center movement
      const dx = currentCenter.x - lastTouchCenter.current.x;
      const dy = currentCenter.y - lastTouchCenter.current.y;
      adjustPan(dx, dy);

      lastTouchDistance.current = currentDistance;
      lastTouchCenter.current = currentCenter;
    }
  }, [adjustPan, adjustZoom]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    touchCount.current = 0;
    lastTouchDistance.current = 0;
  }, []);

  // Wheel Handler Setup
  const setupWheelHandler = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      adjustZoom(delta);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [adjustZoom]);

  // Double-click to reset view
  const handleDoubleClick = useCallback(() => {
    reset();
  }, [reset]);

  // Keyboard shortcuts setup
  const setupKeyboardHandler = useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'Home':
        case 'r':
        case 'R':
          // Reset view
          if (!e.ctrlKey && !e.metaKey) {
            reset();
          }
          break;
        case '0':
          // Reset zoom to 100%
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            reset();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reset]);

  return {
    zoom,
    pan,
    zoomRef,
    panRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setupWheelHandler,
    setupKeyboardHandler,
  };
};
