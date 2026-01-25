import React, { useState, useRef, useEffect, useCallback, RefObject } from 'react';

export interface CanvasControlsState {
    zoom: number;
    pan: { x: number; y: number };
}

export interface CanvasControlsResult extends CanvasControlsState {
    // Refs for direct access in animation loops
    zoomRef: RefObject<number>;
    panRef: RefObject<{ x: number; y: number }>;

    // Setters
    setZoom: (zoom: number) => void;
    setPan: (pan: { x: number; y: number }) => void;

    // Mouse Handlers (to attach to container)
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseUp: () => void;

    // Wheel setup effect (call this in useEffect for canvas)
    setupWheelHandler: (canvas: HTMLCanvasElement | null) => (() => void) | undefined;
}

interface UseCanvasControlsOptions {
    initialZoom?: number;
    initialPan?: { x: number; y: number };
    minZoom?: number;
    maxZoom?: number;
    zoomSensitivity?: number;
}

export const useCanvasControls = (options: UseCanvasControlsOptions = {}): CanvasControlsResult => {
    const {
        initialZoom = 1,
        initialPan = { x: 0, y: 0 },
        minZoom = 0.1,
        maxZoom = 50,
        zoomSensitivity = 0.001
    } = options;

    // State
    const [zoom, setZoomState] = useState(initialZoom);
    const [pan, setPanState] = useState(initialPan);

    // Refs for animation loop access
    const zoomRef = useRef(zoom);
    const panRef = useRef(pan);

    // Drag state
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Sync state to refs
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { panRef.current = pan; }, [pan]);

    // Wrapped setters that update both state and ref
    const setZoom = useCallback((newZoom: number) => {
        const clampedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
        setZoomState(clampedZoom);
        zoomRef.current = clampedZoom;
    }, [minZoom, maxZoom]);

    const setPan = useCallback((newPan: { x: number; y: number }) => {
        setPanState(newPan);
        panRef.current = newPan;
    }, []);

    // Mouse Handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setPan({ x: panRef.current.x + dx, y: panRef.current.y + dy });
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }, [setPan]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    // Wheel Handler Setup
    const setupWheelHandler = useCallback((canvas: HTMLCanvasElement | null) => {
        if (!canvas) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = -e.deltaY * zoomSensitivity;
            const currentZoom = zoomRef.current;
            const newZoom = Math.min(Math.max(currentZoom + delta * currentZoom * 5, minZoom), maxZoom);
            setZoom(newZoom);
        };

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', handleWheel);
    }, [zoomSensitivity, minZoom, maxZoom, setZoom]);

    return {
        zoom,
        pan,
        zoomRef,
        panRef,
        setZoom,
        setPan,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        setupWheelHandler,
    };
};
