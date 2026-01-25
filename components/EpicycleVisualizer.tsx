
import React, { useEffect, useRef, useState } from 'react';
import { ProcessedLayer } from '../types';

interface LayerRenderState {
  pathHistory: { x: number, y: number }[];
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
  // We use refs instead of dependencies to prevent the Effect from restarting (which clears history)
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const layersRef = useRef(layers);
  const isRunningRef = useRef(isRunning);
  const speedRef = useRef(speedMultiplier);
  const historyRef = useRef<LayerRenderState[]>([]);

  // Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Sync Props to Refs
  useEffect(() => {
    layersRef.current = layers;

    // Smart History Reset
    // We track the reference of the coefficients array. 
    // If it changes, it means the geometry was recalculated (new preset, new AI generation, etc.), so we must clear the trail.
    // If only color/opacity changes, the coefficient reference stays the same (from useFourier memoization), so we keep the trail.
    layers.forEach((layer, idx) => {
      if (!historyRef.current[idx]) {
        historyRef.current[idx] = { pathHistory: [] };
      }

      // Check for reference equality of the coefficients array
      const prevCoeffsRef = (historyRef.current as any)[`coeffsRef_${idx}`];

      if (prevCoeffsRef !== layer.coefficients) {
        // Geometry changed -> Clear trail
        historyRef.current[idx].pathHistory = [];

        // Update trackers
        (historyRef.current as any)[`coeffsRef_${idx}`] = layer.coefficients;

        // Reset time if the primary layer changes, giving a fresh start feel
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
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // --- Interaction Handlers ---
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.min(Math.max(zoom + delta * zoom * 5, 0.1), 50);
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom]);

  // --- Drawing Helpers ---
  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, opacity: number, currentZoom: number) => {
    const headLength = 6 / currentZoom;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Optimization: Don't draw tiny vectors
    if (length * currentZoom < 2) return;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5 / currentZoom;
    ctx.globalAlpha = opacity * 0.6;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Only draw arrowhead if the vector is long enough to warrant it
    if (length * currentZoom > 10) {
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, currentPan: { x: number, y: number }, currentZoom: number) => {
    // Background color is handled by CSS, we just clear
    ctx.clearRect(0, 0, w, h); // Clear logic coords

    const cx = w / 2;
    const cy = h / 2;
    const originX = cx + currentPan.x;
    const originY = cy + currentPan.y;

    // Dynamic Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1 / currentZoom; // Keep hairline width regardless of zoom
    if (ctx.lineWidth < 0.5) ctx.lineWidth = 0.5;

    ctx.beginPath();

    const baseStep = 100;
    // We don't want the grid density to change too wildly, 
    // but we do want it to scale. 
    const step = baseStep;

    // Calculate visible range in Logic Coordinates
    // Inverse transform: Screen -> Logic
    // LogicX = (ScreenX - OriginX) / Zoom
    const startX = -originX / currentZoom;
    const endX = (w - originX) / currentZoom;
    const startY = -originY / currentZoom;
    const endY = (h - originY) / currentZoom;

    const gridStartCol = Math.floor(startX / step);
    const gridEndCol = Math.ceil(endX / step);

    for (let i = gridStartCol; i <= gridEndCol; i++) {
      const x = i * step;
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }

    const gridStartRow = Math.floor(startY / step);
    const gridEndRow = Math.ceil(endY / step);

    for (let i = gridStartRow; i <= gridEndRow; i++) {
      const y = i * step;
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2 / currentZoom;
    ctx.beginPath();
    ctx.moveTo(startX, 0); ctx.lineTo(endX, 0); // X Axis
    ctx.moveTo(0, startY); ctx.lineTo(0, endY); // Y Axis
    ctx.stroke();
  };

  // 3. Animation Loop
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

      // --- Setup World Transform ---
      // 1. Scale by DPR (standardize drawing to logical pixels)
      // 2. Translate to Center + Pan
      // 3. Scale by Zoom

      // Standardize to logical pixels first
      ctx.scale(dpr, dpr);

      // Draw background (which handles its own internal logic coords)
      // We pass logicalW/H because we just scaled by DPR

      // NOTE: drawBackground wants to draw full screen lines, but we are about to apply a transform.
      // Let's optimize: Background draws in screen space logic, layers draw in world space logic.

      ctx.save();
      // Draw BG with identity transform (except DPR) implies we act in screen coordinates
      // But drawBackground function calculates world offsets manually. 
      // Let's transform for the LAYERS.

      // Center of screen
      const cx = logicalW / 2;
      const cy = logicalH / 2;

      // Transform Matrix:
      // Translate(cx + pan.x, cy + pan.y)
      // Scale(zoom, zoom)

      ctx.translate(cx + currentPan.x, cy + currentPan.y);
      ctx.scale(currentZoom, currentZoom);

      // Now we are in World Coordinates. (0,0) is the center of the drawing.
      // Draw Grid relative to world 0,0? No, grid is usually fixed or infinite. 
      // Let's invoke drawBackground inside this transform context? 
      // Actually simpler: inverse map the screen bounds to draw grid lines.
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

          // Find primary component (fundamental frequency) for modulation usually
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

            // Cull very small epicycles to save performance
            // threshold depends on zoom. If it's less than 0.5px on screen, skip drawing the circle
            const screenRadius = Math.abs(currentAmp) * currentZoom;
            const isVisible = screenRadius > 0.5;

            const val = freq * currentTime + phase;
            x += currentAmp * Math.cos(val);
            y += currentAmp * Math.sin(val);

            // Only draw first N circles or significant ones to reduce clutter
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
              // Decimate points for fill performance
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
            if (ctx.lineWidth < 1 / currentZoom) ctx.lineWidth = 1 / currentZoom; // min width

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
          // Tip size stays constant relative to screen? or world? Let's make it world relative but clamped
          const tipSize = 4 / currentZoom;
          ctx.arc(x, y, tipSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      ctx.restore();

      // Time Step
      if (isRunningRef.current) {
        // Normalize speed: full circle in 1000 steps roughly
        const step = (2 * Math.PI) / 1000;
        timeRef.current += step * speedRef.current;
        if (timeRef.current > 2 * Math.PI) {
          timeRef.current -= 2 * Math.PI;
          // Optional: clear history on loop? No, it looks better continuous.
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []); // Empty dependencies! Loop handles everything via refs.

  // 4. Resize Observer handling
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          const dpr = window.devicePixelRatio || 1;

          if (canvasRef.current) {
            // Set actual buffer size
            canvasRef.current.width = width * dpr;
            canvasRef.current.height = height * dpr;

            // Set CSS size
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
          {layers.map((l, idx) => (
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
