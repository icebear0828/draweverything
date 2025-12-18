
import React, { useEffect, useRef, useState } from 'react';
import { Complex, FourierCoefficient, MathLayer } from '../types';
import { dft } from '../utils/math';

interface LayerData {
  coefficients: FourierCoefficient[];
  color: string;
  fillColor?: string;
  opacity: number;
  lineWidth: number;
  pathHistory: {x: number, y: number}[];
  modFn: (t: number) => number;
}

interface EpicycleVisualizerProps {
  pathData: Complex[][]; 
  layerConfigs?: Partial<MathLayer>[]; 
  isRunning: boolean;
  speedMultiplier: number;
}

const EpicycleVisualizer: React.FC<EpicycleVisualizerProps> = ({ 
  pathData, 
  layerConfigs,
  isRunning, 
  speedMultiplier 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const [layers, setLayers] = useState<LayerData[]>([]);

  // Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 1. Compute DFT
  useEffect(() => {
    if (pathData.length > 0) {
        const newLayers: LayerData[] = pathData.map((path, index) => {
            const coeffs = dft(path);
            const config = layerConfigs?.[index];
            const defaultColors = ['#22d3ee', '#e879f9', '#fbbf24', '#a78bfa', '#34d399'];
            
            // Parse modulation function
            let modFn = (t: number) => 1;
            if (config?.ampModFn) {
                try {
                    // eslint-disable-next-line no-new-func
                    modFn = new Function('t', `return ${config.ampModFn};`) as (t: number) => number;
                } catch (e) {
                    console.error("Invalid modulation function", e);
                }
            }
            
            return {
                coefficients: coeffs,
                color: config?.colorHex || defaultColors[index % defaultColors.length],
                fillColor: config?.fillColor,
                opacity: config?.opacity ?? 1.0,
                lineWidth: config?.lineWidth ?? 2.5,
                pathHistory: [],
                modFn
            };
        });
        setLayers(newLayers);
    } else {
        setLayers([]);
    }
  }, [pathData, layerConfigs]);

  // 2. Reset Logic
  useEffect(() => {
     timeRef.current = 0;
     setLayers(prev => prev.map(l => ({ ...l, pathHistory: [] })));
  }, [pathData, speedMultiplier]); 

  // --- Interaction Handlers ---
  const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      // Negative deltaY means scrolling up (zooming in)
      const delta = -e.deltaY * zoomSensitivity;
      // Clamp zoom to reasonable levels
      const newZoom = Math.min(Math.max(zoom + delta * zoom * 5, 0.1), 20);
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

  // Attach non-passive wheel listener for preventing default scroll
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom]); // Re-bind if zoom changes (though logic uses state setter, good practice)

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, opacity: number) => {
      const headLength = 5 / zoom; // Scale arrow head with zoom so it doesn't get huge
      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = Math.atan2(dy, dx);
      const length = Math.sqrt(dx*dx + dy*dy);

      if (length * zoom < 2) return; // Optimize small arrows

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5 / zoom; // Scale line width
      ctx.globalAlpha = opacity;

      // Shaft
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      
      ctx.globalAlpha = 1.0;
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = '#050505'; 
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      
      // Calculate effective origin on screen
      const originX = cx + pan.x;
      const originY = cy + pan.y;

      // Dynamic Grid
      ctx.strokeStyle = '#27272a'; // Zinc-800
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      
      const baseStep = 50;
      const step = baseStep * zoom;
      
      // Calculate grid range visible on screen
      const startCol = Math.floor(-originX / step);
      const endCol = Math.floor((w - originX) / step) + 1;
      
      for(let i = startCol; i <= endCol; i++) {
          const x = i * step + originX;
          ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      
      const startRow = Math.floor(-originY / step);
      const endRow = Math.floor((h - originY) / step) + 1;

      for(let i = startRow; i <= endRow; i++) {
          const y = i * step + originY;
          ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Main Axes
      ctx.strokeStyle = '#52525b'; // Zinc-600
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      // Y-Axis (Draw if visible)
      if (originX >= -1 && originX <= w + 1) {
        ctx.moveTo(originX, 0); ctx.lineTo(originX, h);
      }
      
      // X-Axis (Draw if visible)
      if (originY >= -1 && originY <= h + 1) {
        ctx.moveTo(0, originY); ctx.lineTo(w, originY);
      }
      ctx.stroke();
  };

  // 3. Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!canvas || !ctx) return;
      
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const cx = w / 2;
      const cy = h / 2;

      // Reset transform for background drawing
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      drawBackground(ctx, w, h);

      if (layers.length === 0) return;

      // Apply Pan & Zoom Transform
      // We translate to center + pan, then scale
      ctx.translate(cx + pan.x, cy + pan.y);
      ctx.scale(zoom, zoom);

      layers.forEach((layer) => {
          if (layer.coefficients.length === 0) return;

          // Start from (0,0) in our transformed world space
          let x = 0;
          let y = 0;
          
          const sortedCoeffs = layer.coefficients; 
          
          // Calculate modulation value for this frame
          let modValue = 1;
          try {
             modValue = layer.modFn(timeRef.current);
             if (isNaN(modValue)) modValue = 1;
          } catch { modValue = 1; }

          // Identify primary epicycle (largest non-DC)
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
            
            // Apply modulation to primary epicycle only
            let currentAmp = amp;
            if (i === primaryIndex) {
                currentAmp = amp * modValue;
            }

            // Limit rendered circles for performance
            // We consider the modulated amplitude for visibility check
            const isSignificant = i < 60 && (currentAmp * zoom) > 0.5;

            const val = freq * timeRef.current + phase;
            x += currentAmp * Math.cos(val);
            y += currentAmp * Math.sin(val);

            if (isSignificant) {
                 // Circle
                 ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                 ctx.lineWidth = 1 / zoom; // Keep thin regardless of zoom
                 ctx.beginPath();
                 ctx.arc(prevX, prevY, Math.abs(currentAmp), 0, 2 * Math.PI);
                 ctx.stroke();
                 
                 // Vector
                 drawArrow(ctx, prevX, prevY, x, y, layer.color, 0.5);
            }
          }

          // History is stored in RELATIVE coordinates now
          layer.pathHistory.unshift({ x, y });
          const maxPoints = 2500; 
          if (layer.pathHistory.length > maxPoints) {
              layer.pathHistory.pop();
          }

          // Draw Path
          if (layer.pathHistory.length > 2) {
            
            // Fill
            if (layer.fillColor) {
                ctx.fillStyle = layer.fillColor;
                ctx.globalAlpha = 0.2;
                ctx.beginPath();
                ctx.moveTo(layer.pathHistory[0].x, layer.pathHistory[0].y);
                for (let i = 1; i < layer.pathHistory.length; i+=4) {
                    ctx.lineTo(layer.pathHistory[i].x, layer.pathHistory[i].y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            // Stroke
            ctx.shadowBlur = 15;
            ctx.shadowColor = layer.color;
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = layer.lineWidth / zoom; // consistent width
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(layer.pathHistory[0].x, layer.pathHistory[0].y);
            for (let i = 1; i < layer.pathHistory.length; i++) {
                ctx.lineTo(layer.pathHistory[i].x, layer.pathHistory[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
          
          // Pen Tip
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = '#ffffff'; 
          ctx.beginPath();
          ctx.arc(x, y, 2.5 / zoom, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
      });

      if (isRunning) {
        const step = (2 * Math.PI) / 1000; 
        timeRef.current += step * speedMultiplier;
        if (timeRef.current > 2 * Math.PI) {
           timeRef.current -= 2 * Math.PI;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [layers, isRunning, speedMultiplier, zoom, pan]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current && canvasRef.current.parentElement) {
            const dpr = window.devicePixelRatio || 1;
            const parent = canvasRef.current.parentElement;
            
            // The canvas should be 100% of the PARENT container
            const rect = parent.getBoundingClientRect();
            
            canvasRef.current.width = rect.width * dpr;
            canvasRef.current.height = rect.height * dpr;
            
            // We set context scale in the render loop now
            
            canvasRef.current.style.width = `${rect.width}px`;
            canvasRef.current.style.height = `${rect.height}px`;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing">
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Heads Up Display (HUD) - Top Right */}
      <div className="absolute top-8 right-8 pointer-events-none select-none z-10 flex flex-col gap-3 items-end">
        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-1 mb-1 text-right">
             Zoom: {Math.round(zoom * 100)}%
        </div>
        <div className="flex flex-col gap-2 items-end">
            {layers.map((l, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-zinc-800/50 backdrop-blur-sm">
                    <span className="text-zinc-400 font-mono text-[10px]">
                        f<sub>{idx+1}</sub> <span className="opacity-30 mx-1">|</span> {l.coefficients.length} terms
                    </span>
                    <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{backgroundColor: l.color, boxShadow: `0 0 8px ${l.color}`}}></div>
                </div>
            ))}
        </div>
      </div>
      
    </div>
  );
};

export default EpicycleVisualizer;
