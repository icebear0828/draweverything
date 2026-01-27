
import React, { useEffect, useRef, useMemo } from 'react';
import { ProcessedLayer, FourierCoefficient } from '../types';
import { useSharedCanvasControls } from '../hooks/useSharedCanvasControls';
import { drawArrow, drawBackground } from '../utils/canvas';
import {
  PATH_HISTORY_MAX_POINTS,
  MAX_VISIBLE_EPICYCLES,
  EPICYCLE_MIN_SCREEN_RADIUS,
  PEN_TIP_BASE_SIZE,
  ANIMATION_TIME_STEP,
} from '../constants/config';

// Circular buffer for O(1) path history operations
interface CircularBuffer {
  buffer: { x: number, y: number }[];
  head: number;   // Next write position
  count: number;  // Current number of elements
}

interface LayerRenderState {
  pathHistory: CircularBuffer;
}

// Extended type for tracking coefficient changes
interface LayerHistoryTracker extends LayerRenderState {
  coeffsRef?: FourierCoefficient[];
}

// Helper to create empty circular buffer
const createCircularBuffer = (): CircularBuffer => ({
  buffer: new Array(PATH_HISTORY_MAX_POINTS),
  head: 0,
  count: 0,
});

// Helper to push to circular buffer (O(1))
const pushToBuffer = (cb: CircularBuffer, point: { x: number, y: number }) => {
  cb.buffer[cb.head] = point;
  cb.head = (cb.head + 1) % PATH_HISTORY_MAX_POINTS;
  if (cb.count < PATH_HISTORY_MAX_POINTS) {
    cb.count++;
  }
};

// Helper to iterate circular buffer from newest to oldest
const iterateBuffer = (cb: CircularBuffer, callback: (point: { x: number, y: number }, index: number) => void) => {
  for (let i = 0; i < cb.count; i++) {
    // Start from (head - 1) and go backwards (newest first)
    const idx = (cb.head - 1 - i + PATH_HISTORY_MAX_POINTS) % PATH_HISTORY_MAX_POINTS;
    callback(cb.buffer[idx], i);
  }
};

interface EpicycleVisualizerProps {
  layers: ProcessedLayer[];
  isRunning: boolean;
  speedMultiplier: number;
  /** 背景透明模式 (用于图层叠加) */
  transparent?: boolean;
}

const EpicycleVisualizer: React.FC<EpicycleVisualizerProps> = ({
  layers,
  isRunning,
  speedMultiplier,
  transparent = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for mutable state accessed in the animation loop
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const layersRef = useRef(layers);
  const isRunningRef = useRef(isRunning);
  const speedRef = useRef(speedMultiplier);
  const historyRef = useRef<LayerHistoryTracker[]>([]);

  // Use the shared canvas controls hook (synced with other visualizers)
  const {
    zoom,
    zoomRef,
    panRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setupWheelHandler
  } = useSharedCanvasControls();

  // Pre-compute primary indices for each layer (first non-zero frequency)
  // This avoids recalculating in every frame of the animation loop
  const primaryIndices = useMemo(() => {
    return layers.map((layer) => {
      const coeffs = layer.coefficients;
      for (let i = 0; i < coeffs.length; i++) {
        if (coeffs[i].freq !== 0) {
          return i;
        }
      }
      return -1;
    });
  }, [layers]);
  const primaryIndicesRef = useRef(primaryIndices);
  useEffect(() => { primaryIndicesRef.current = primaryIndices; }, [primaryIndices]);

  // Sync Props to Refs
  useEffect(() => {
    layersRef.current = layers;

    // Smart History Reset
    layers.forEach((layer, idx) => {
      if (!historyRef.current[idx]) {
        historyRef.current[idx] = { pathHistory: createCircularBuffer() };
      }

      // Check for reference equality of the coefficients array
      const tracker = historyRef.current[idx];

      if (tracker.coeffsRef !== layer.coefficients) {
        // Geometry changed -> Clear trail (reset circular buffer)
        tracker.pathHistory = createCircularBuffer();
        tracker.coeffsRef = layer.coefficients;

        // Reset time if the primary layer changes
        if (idx === 0) {
          timeRef.current = 0;
        }
      }
    });

    // Clean up extra history slots if layers were removed
    if (historyRef.current.length > layers.length) {
      historyRef.current.length = layers.length;
    }

  }, [layers]);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { speedRef.current = speedMultiplier; }, [speedMultiplier]);

  // Setup wheel handler for canvas
  useEffect(() => {
    return setupWheelHandler(canvasRef.current);
  }, [setupWheelHandler]);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const render = () => {
      if (!canvas || !ctx) return;

      // Read current state from refs
      const currentLayers = layersRef.current;
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      const currentTime = timeRef.current;

      const dpr = window.devicePixelRatio || 1;

      // Canvas dimensions (Physical pixels)
      const width = canvas.width;
      const height = canvas.height;

      // Logical dimensions (CSS pixels)
      const logicalW = width / dpr;
      const logicalH = height / dpr;

      // Reset Transform to Identity for clearRect
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Standardize to logical pixels first
      ctx.scale(dpr, dpr);

      ctx.save();

      // Center of screen
      const cx = logicalW / 2;
      const cy = logicalH / 2;

      ctx.translate(cx + currentPan.x, cy + currentPan.y);
      ctx.scale(currentZoom, currentZoom);

      // Draw Grid
      drawBackground(ctx, logicalW, logicalH, currentPan, currentZoom);

      if (currentLayers.length > 0) {
        currentLayers.forEach((layer, idx) => {
          if (layer.coefficients.length === 0) return;

          if (!historyRef.current[idx]) historyRef.current[idx] = { pathHistory: createCircularBuffer() };
          const layerState = historyRef.current[idx];

          let x = 0;
          let y = 0;

          let modValue = 1;
          try {
            modValue = layer.modFn(currentTime);
            if (isNaN(modValue) || !isFinite(modValue)) modValue = 1;
          } catch { modValue = 1; }

          const sortedCoeffs = layer.coefficients;

          // Use pre-computed primary index (first non-zero frequency)
          const primaryIndex = primaryIndicesRef.current[idx] ?? -1;

          for (let i = 0; i < sortedCoeffs.length; i++) {
            const prevX = x;
            const prevY = y;
            const { freq, amp, phase } = sortedCoeffs[i];

            let currentAmp = amp;
            if (i === primaryIndex) {
              currentAmp = amp * modValue;
            }

            // Cull very small epicycles
            const screenRadius = Math.abs(currentAmp) * currentZoom;
            const isVisible = screenRadius > EPICYCLE_MIN_SCREEN_RADIUS;

            const val = freq * currentTime + phase;
            x += currentAmp * Math.cos(val);
            y += currentAmp * Math.sin(val);

            // Only draw significant circles
            const isSignificant = i < MAX_VISIBLE_EPICYCLES && isVisible;

            if (isSignificant) {
              // Circle
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
              ctx.lineWidth = 1 / currentZoom;
              ctx.beginPath();
              ctx.arc(prevX, prevY, Math.abs(currentAmp), 0, 2 * Math.PI);
              ctx.stroke();

              // Vector
              drawArrow(ctx, prevX, prevY, x, y, layer.color, 0.5, currentZoom);
            }
          }

          // Update History (O(1) with circular buffer)
          pushToBuffer(layerState.pathHistory, { x, y });

          // Draw Path
          const historyCount = layerState.pathHistory.count;
          if (historyCount > 2) {
            // Collect points from circular buffer for drawing
            const points: { x: number, y: number }[] = [];
            iterateBuffer(layerState.pathHistory, (point) => {
              points.push(point);
            });

            // Fill (Optional)
            if (layer.fillColor) {
              ctx.fillStyle = layer.fillColor;
              ctx.globalAlpha = 0.2;
              ctx.beginPath();
              ctx.moveTo(points[0].x, points[0].y);
              for (let i = 1; i < points.length; i += 2) {
                ctx.lineTo(points[i].x, points[i].y);
              }
              ctx.closePath();
              ctx.fill();
              ctx.globalAlpha = 1.0;
            }

            // Stroke
            ctx.shadowBlur = 10;
            ctx.shadowColor = layer.color;
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = layer.lineWidth / currentZoom;
            if (ctx.lineWidth < 1 / currentZoom) ctx.lineWidth = 1 / currentZoom;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Pen Tip
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          const tipSize = PEN_TIP_BASE_SIZE / currentZoom;
          ctx.arc(x, y, tipSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      ctx.restore();

      // Time Step
      if (isRunningRef.current) {
        timeRef.current += ANIMATION_TIME_STEP * speedRef.current;
        if (timeRef.current > 2 * Math.PI) {
          timeRef.current -= 2 * Math.PI;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [panRef, zoomRef]);

  // Resize Observer handling
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          const dpr = window.devicePixelRatio || 1;

          if (canvasRef.current) {
            canvasRef.current.width = width * dpr;
            canvasRef.current.height = height * dpr;
            canvasRef.current.style.width = `${width}px`;
            canvasRef.current.style.height = `${height}px`;
          }
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden cursor-move active:cursor-grabbing ${transparent ? '' : 'bg-[#050505]'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
      />

      {/* HUD - Bottom Left */}
      <div className="absolute bottom-6 left-6 pointer-events-none select-none z-10 flex flex-col gap-2 items-start opacity-70">
        <div className="flex flex-col gap-2 items-start">
          {layers.map((l) => (
            <div key={l.id} className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: l.color, boxShadow: `0 0 8px ${l.color}` }}></div>
              <span className="text-zinc-400 font-mono text-[10px]">
                {l.coefficients.length} vectors
              </span>
            </div>
          ))}
        </div>
        <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>

    </div>
  );
};

export default EpicycleVisualizer;
