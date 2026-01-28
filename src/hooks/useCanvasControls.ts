import { useState, useRef, useEffect, useCallback, type RefObject, type MouseEvent, type TouchEvent } from 'react';

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
    reset: () => void;

    // Mouse Handlers (to attach to container)
    handleMouseDown: (e: MouseEvent) => void;
    handleMouseMove: (e: MouseEvent) => void;
    handleMouseUp: () => void;
    handleDoubleClick: () => void;

    // Touch Handlers
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: () => void;

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

const PINCH_ZOOM_SENSITIVITY = 0.01;

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

    // Touch state
    const lastTouchDistance = useRef(0);
    const lastTouchCenter = useRef({ x: 0, y: 0 });
    const touchCount = useRef(0);

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

    const reset = useCallback(() => {
        setZoom(initialZoom);
        setPan(initialPan);
    }, [initialZoom, initialPan, setZoom, setPan]);

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

    const handleDoubleClick = useCallback(() => {
        reset();
    }, [reset]);

    // Touch Handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchCount.current = e.touches.length;

        if (e.touches.length === 1) {
            isDragging.current = true;
            lastTouchCenter.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        } else if (e.touches.length === 2) {
            isDragging.current = true;
            lastTouchDistance.current = getTouchDistance(e.touches);
            lastTouchCenter.current = getTouchCenter(e.touches);
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current) return;

        if (e.touches.length === 1 && touchCount.current === 1) {
            const dx = e.touches[0].clientX - lastTouchCenter.current.x;
            const dy = e.touches[0].clientY - lastTouchCenter.current.y;
            setPan({ x: panRef.current.x + dx, y: panRef.current.y + dy });
            lastTouchCenter.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        } else if (e.touches.length === 2) {
            const currentDistance = getTouchDistance(e.touches);
            const currentCenter = getTouchCenter(e.touches);

            if (lastTouchDistance.current > 0) {
                const distanceDelta = currentDistance - lastTouchDistance.current;
                const zoomDelta = distanceDelta * PINCH_ZOOM_SENSITIVITY;
                const newZoom = zoomRef.current * (1 + zoomDelta);
                setZoom(newZoom);
            }

            const dx = currentCenter.x - lastTouchCenter.current.x;
            const dy = currentCenter.y - lastTouchCenter.current.y;
            setPan({ x: panRef.current.x + dx, y: panRef.current.y + dy });

            lastTouchDistance.current = currentDistance;
            lastTouchCenter.current = currentCenter;
        }
    }, [setPan, setZoom]);

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
        reset,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleDoubleClick,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        setupWheelHandler,
    };
};
