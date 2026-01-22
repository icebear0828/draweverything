
import React, { useEffect, useRef, useState } from 'react';

interface GenerativeVisualizerProps {
  isRunning: boolean;
  speed: number;
}

const GenerativeVisualizer: React.FC<GenerativeVisualizerProps> = ({ isRunning, speed }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const timeRef = useRef(0);
  const animationFrameRef = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Interactive Controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        setZoom(z => Math.min(Math.max(z + delta * z * 5, 0.1), 50));
    };
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      setPan(p => ({ 
          x: p.x + (e.clientX - lastMousePos.current.x), 
          y: p.y + (e.clientY - lastMousePos.current.y) 
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => { isDragging.current = false; };

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            if (entry.target === containerRef.current) {
                const { width, height } = entry.contentRect;
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = width * dpr;
                canvasRef.current.height = height * dpr;
                canvasRef.current.style.width = `${width}px`;
                canvasRef.current.style.height = `${height}px`;
            }
        }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Animation Loop
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const PARTICLE_COUNT = 4000;
      
      const render = () => {
          const width = canvas.width;
          const height = canvas.height;
          const dpr = window.devicePixelRatio || 1;
          
          // Clear with trail effect (optional, but clean clear is better for sharp dots)
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, width, height);
          
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.translate((width/dpr)/2 + pan.x, (height/dpr)/2 + pan.y);
          ctx.scale(zoom * 4, zoom * 4); // Base scale multiplier for visibility

          const t = timeRef.current;
          
          // --- FORMULA IMPLEMENTATION ---
          // F(n, t) components:
          // 1. Diffusion: n^1.5 / (n + 1000)
          // 2. Wave: sin(0.1 * n * sin(83.333 * t))
          // 3. Rotation: 0.1 * n * t

          for (let n = 1; n < PARTICLE_COUNT; n++) {
             // 1. Radius Base
             // n goes up to 4000. 
             // r_base max approx: 4000^1.5 / 5000 = 253000 / 5000 = 50.
             const rBase = Math.pow(n, 1.5) / (n + 1000);
             
             // 2. Wave Component
             // 83.333 is approx 1000/12. Fast frequency.
             // We scale t by 0.001 inside the loop logic generally, but here let's trust the formula ratios.
             // If t moves by 0.01 per frame, 83*t moves by 0.8.
             const wave = Math.sin(0.1 * n * Math.sin(83.333 * t));
             
             // 3. Theta
             // 0.1 * n * t. 
             // This creates the interference.
             const theta = 0.1 * n * t;

             // Map to Coordinate
             // How does 'wave' affect position? 
             // In generative art, this usually modulates the radius to create "breathing" bands.
             const rFinal = rBase * (1 + 0.3 * wave); 
             
             const x = rFinal * Math.cos(theta);
             const y = rFinal * Math.sin(theta);

             // Draw Particle
             ctx.fillStyle = '#ffffff';
             
             // Opacity creates depth
             // Inner stars brighter? Or random?
             // Let's use wave to modulate opacity too for sparkling effect
             const alpha = 0.3 + 0.7 * Math.abs(wave);
             ctx.globalAlpha = alpha;
             
             const size = 0.8 / zoom; // Keep size constant on screen or scale? Constant is better for stars.
             
             ctx.beginPath();
             ctx.arc(x, y, Math.max(0.5, size), 0, 2 * Math.PI);
             ctx.fill();
          }
          
          ctx.restore();

          if (isRunning) {
              // Time step needs to be very small because the formula has large multipliers (83.333)
              // If step is too big, it looks like noise.
              timeRef.current += 0.0002 * speed; 
          }
          
          animationFrameRef.current = requestAnimationFrame(render);
      };
      
      animationFrameRef.current = requestAnimationFrame(render);
      return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isRunning, speed, pan, zoom]);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full relative cursor-move active:cursor-grabbing bg-[#050505]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
        <canvas ref={canvasRef} className="block w-full h-full touch-none" />
        
        {/* HUD */}
        <div className="absolute bottom-6 left-6 pointer-events-none select-none z-10 opacity-70">
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-cyan-500/20 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                <span className="text-cyan-100 font-mono text-[10px] tracking-wider">
                    PARTICLE SYSTEM ACTIVE: n=4000
                </span>
            </div>
        </div>
    </div>
  );
};

export default GenerativeVisualizer;
