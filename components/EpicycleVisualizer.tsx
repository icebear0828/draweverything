
import React, { useEffect, useRef } from 'react';
import { ProcessedLayer, FourierCoefficient } from '../types';
import { useCanvasControls } from '../hooks/useCanvasControls';
import { drawArrow, drawBackground } from '../utils/canvas';

interface LayerRenderState {
  pathHistory: { x: number, y: number }[];
}

// Extended type for tracking coefficient changes
interface LayerHistoryTracker extends LayerRenderState {
  coeffsRef?: FourierCoefficient[];
}

interface EpicycleVisualizerProps {
  layers: ProcessedLayer[];
  isRunning: boolean;
  speedMultiplier: number;
}

const EpicycleVisualizer: React.FC<EpicycleVisualizerProps> = ({
  layers,
  isRunning,
  speedMultiplier
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

  // Use the unified canvas controls hook
  const {
    zoom,
    zoomRef,
    panRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setupWheelHandler
  } = useCanvasControls();

  // Sync Props to Refs
  useEffect(() => {
    layersRef.current = layers;

    // Smart History Reset
    layers.forEach((layer, idx) => {
      if (!historyRef.current[idx]) {
        historyRef.current[idx] = { pathHistory: [] };
      }

      // Check for reference equality of the coefficients array
      const tracker = historyRef.current[idx];

      if (tracker.coeffsRef !== layer.coefficients) {
        // Geometry changed -> Clear trail
        tracker.pathHistory = [];
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

          if (!historyRef.current[idx]) historyRef.current[idx] = { pathHistory: [] };
          const layerState = historyRef.current[idx];

          let x = 0;
          let y = 0;

          let modValue = 1;
          try {
            modValue = layer.modFn(currentTime);
            if (isNaN(modValue)) modValue = 1;
          } catch { modValue = 1; }

          const sortedCoeffs = layer.coefficients;

          // Find primary component (fundamental frequency) for modulation
          let primaryIndex = -1;
          for (let i = 0; i < sortedCoeffs.length; i++) {
            if (sortedCoeffs[i].freq !== 0) {
              primaryIndex = i;
              break;
            }
          }

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
            const isVisible = screenRadius > 0.5;

            const val = freq * currentTime + phase;
            x += currentAmp * Math.cos(val);
            y += currentAmp * Math.sin(val);

            // Only draw significant circles
            const isSignificant = i < 50 && isVisible;

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

          // Update History
          layerState.pathHistory.unshift({ x, y });
          const maxPoints = 2000;
          if (layerState.pathHistory.length > maxPoints) {
            layerState.pathHistory.pop();
          }

          // Draw Path
          if (layerState.pathHistory.length > 2) {
            // Fill (Optional)
            if (layer.fillColor) {
              ctx.fillStyle = layer.fillColor;
              ctx.globalAlpha = 0.2;
              ctx.beginPath();
              ctx.moveTo(layerState.pathHistory[0].x, layerState.pathHistory[0].y);
              for (let i = 1; i < layerState.pathHistory.length; i += 2) {
                ctx.lineTo(layerState.pathHistory[i].x, layerState.pathHistory[i].y);
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
            ctx.moveTo(layerState.pathHistory[0].x, layerState.pathHistory[0].y);
            for (let i = 1; i < layerState.pathHistory.length; i++) {
              ctx.lineTo(layerState.pathHistory[i].x, layerState.pathHistory[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Pen Tip
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          const tipSize = 4 / currentZoom;
          ctx.arc(x, y, tipSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      ctx.restore();

      // Time Step
      if (isRunningRef.current) {
        const step = (2 * Math.PI) / 1000;
        timeRef.current += step * speedRef.current;
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
      className="w-full h-full relative overflow-hidden cursor-move active:cursor-grabbing bg-[#050505]"
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
