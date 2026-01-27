/**
 * useSharedCanvasControls Hook
 * 使用共享的 canvas store，让多个可视化组件同步缩放/平移
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useCanvasStore } from '../stores/useCanvasStore';

const ZOOM_SENSITIVITY = 0.001;

export interface SharedCanvasControlsResult {
  // State (from store)
  zoom: number;
  pan: { x: number; y: number };

  // Refs for animation loop access (synced with store)
  zoomRef: React.MutableRefObject<number>;
  panRef: React.MutableRefObject<{ x: number; y: number }>;

  // Mouse Handlers
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;

  // Wheel setup
  setupWheelHandler: (canvas: HTMLCanvasElement | null) => (() => void) | undefined;
}

export const useSharedCanvasControls = (): SharedCanvasControlsResult => {
  // Get state and actions from store
  const zoom = useCanvasStore((s) => s.zoom);
  const pan = useCanvasStore((s) => s.pan);
  const adjustZoom = useCanvasStore((s) => s.adjustZoom);
  const adjustPan = useCanvasStore((s) => s.adjustPan);

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

  return {
    zoom,
    pan,
    zoomRef,
    panRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setupWheelHandler,
  };
};
