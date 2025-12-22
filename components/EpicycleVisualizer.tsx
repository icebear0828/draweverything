
import React, { useEffect, useRef, useState } from 'react';
import { ProcessedLayer } from '../types';

interface LayerRenderState {
  pathHistory: {x: number, y: number}[];
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  
  // Local state for visual history (trail) only. 
  // We use a Ref for history to prevent React Re-renders, but map it by layer index.
  const historyRef = useRef<LayerRenderState[]>([]);

  // Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Reset history when layers change significantly (count or coefficients)
  useEffect(() => {
     timeRef.current = 0;
     historyRef.current = layers.map(() => ({ pathHistory: [] }));
  }, [layers.length, layers[0]?.coefficients.length]); 

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

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, opacity: number) => {
      const headLength = 6 / zoom; 
      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = Math.atan2(dy, dx);
      const length = Math.sqrt(dx*dx + dy*dy);

      if (length * zoom < 3) return; 

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5 / zoom; 
      ctx.globalAlpha = opacity * 0.6; 

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
      
      const cx = w / 2;
      const cy = h / 2;
      const originX = cx + pan.x;
      const originY = cy + pan.y;

      // Dynamic Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; 
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      const baseStep = 100;
      const step = baseStep * zoom;
      
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

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; 
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (originX >= -100 && originX <= w + 100) {
        ctx.moveTo(originX, 0); ctx.lineTo(originX, h);
      }
      if (originY >= -100 && originY <= h + 100) {
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

      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      drawBackground(ctx, w, h);

      if (layers.length === 0) return;

      ctx.translate(cx + pan.x, cy + pan.y);
      ctx.scale(zoom, zoom);

      layers.forEach((layer, idx) => {
          if (layer.coefficients.length === 0) return;
          
          // Ensure history object exists
          if (!historyRef.current[idx]) {
              historyRef.current[idx] = { pathHistory: [] };
          }
          const layerState = historyRef.current[idx];

          let x = 0;
          let y = 0;
          
          const sortedCoeffs = layer.coefficients; 
          
          let modValue = 1;
          try {
             modValue = layer.modFn(timeRef.current);
             if (isNaN(modValue)) modValue = 1;
          } catch { modValue = 1; }

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

            const isSignificant = i < 60 && (currentAmp * zoom) > 0.5;

            const val = freq * timeRef.current + phase;
            x += currentAmp * Math.cos(val);
            y += currentAmp * Math.sin(val);

            if (isSignificant) {
                 // Circle
                 ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                 ctx.lineWidth = 1 / zoom; 
                 ctx.beginPath();
                 ctx.arc(prevX, prevY, Math.abs(currentAmp), 0, 2 * Math.PI);
                 ctx.stroke();
                 
                 // Vector
                 drawArrow(ctx, prevX, prevY, x, y, layer.color, 0.5);
            }
          }

          layerState.pathHistory.unshift({ x, y });
          const maxPoints = 3000; 
          if (layerState.pathHistory.length > maxPoints) {
              layerState.pathHistory.pop();
          }

          // Draw Path
          if (layerState.pathHistory.length > 2) {
            if (layer.fillColor) {
                ctx.fillStyle = layer.fillColor;
                ctx.globalAlpha = 0.2;
                ctx.beginPath();
                ctx.moveTo(layerState.pathHistory[0].x, layerState.pathHistory[0].y);
                for (let i = 1; i < layerState.pathHistory.length; i+=4) {
                    ctx.lineTo(layerState.pathHistory[i].x, layerState.pathHistory[i].y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            ctx.shadowBlur = 15;
            ctx.shadowColor = layer.color;
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = layer.lineWidth / zoom; 
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
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = '#ffffff'; 
          ctx.beginPath();
          ctx.arc(x, y, 3 / zoom, 0, 2 * Math.PI);
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
            
            canvasRef.current.width = parent.clientWidth * dpr;
            canvasRef.current.height = parent.clientHeight * dpr;
            
            canvasRef.current.style.width = `${parent.clientWidth}px`;
            canvasRef.current.style.height = `${parent.clientHeight}px`;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden cursor-move active:cursor-grabbing">
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* HUD - Bottom Left */}
      <div className="absolute bottom-6 left-6 pointer-events-none select-none z-0 flex flex-col gap-2 items-start opacity-70">
        <div className="flex flex-col gap-2 items-start">
            {layers.map((l, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{backgroundColor: l.color, boxShadow: `0 0 8px ${l.color}`}}></div>
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
