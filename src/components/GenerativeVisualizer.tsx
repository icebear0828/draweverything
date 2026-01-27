
import React, { useEffect, useRef, useMemo } from 'react';
import { useSharedCanvasControls } from '../hooks/useSharedCanvasControls';
import { ParticleFormula } from '../types';
import { compileParticleFormula, CompiledParticleFormula } from '../utils/particleCompiler';

interface GenerativeVisualizerProps {
    isRunning: boolean;
    speed: number;
    formula?: ParticleFormula;
}

const GenerativeVisualizer: React.FC<GenerativeVisualizerProps> = ({
    isRunning,
    speed,
    formula
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const timeRef = useRef(0);
    const animationFrameRef = useRef(0);

    // Compile formula once when it changes
    const compiledFormula = useMemo<CompiledParticleFormula>(() => {
        return compileParticleFormula(formula);
    }, [formula]);

    // Keep a ref for animation loop access
    const formulaRef = useRef(compiledFormula);
    useEffect(() => {
        formulaRef.current = compiledFormula;
    }, [compiledFormula]);

    // Use the shared canvas controls hook (synced with other visualizers)
    const {
        zoomRef,
        panRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        setupWheelHandler
    } = useSharedCanvasControls();

    // Setup wheel handler for canvas
    useEffect(() => {
        return setupWheelHandler(canvasRef.current);
    }, [setupWheelHandler]);

    // Resize Observer
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

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const dpr = window.devicePixelRatio || 1;

            const currentZoom = zoomRef.current;
            const currentPan = panRef.current;
            const f = formulaRef.current;

            // Clear
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.translate((width / dpr) / 2 + currentPan.x, (height / dpr) / 2 + currentPan.y);
            ctx.scale(currentZoom * 4, currentZoom * 4);

            const t = timeRef.current;

            // Use compiled formulas
            for (let n = 1; n < f.particleCount; n++) {
                const rBase = f.radiusFn(n, t);
                const rMod = f.radiusModFn(n, t);
                const theta = f.thetaFn(n, t);
                const rFinal = rBase * rMod;

                const x = rFinal * Math.cos(theta);
                const y = rFinal * Math.sin(theta);

                const alpha = f.alphaFn(n, t, rMod);
                ctx.fillStyle = f.colorHex;
                ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

                const size = 0.8 / currentZoom;

                ctx.beginPath();
                ctx.arc(x, y, Math.max(0.5, size), 0, 2 * Math.PI);
                ctx.fill();
            }

            ctx.restore();

            if (isRunning) {
                timeRef.current += f.timeScale * speed;
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isRunning, speed, zoomRef, panRef]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative cursor-move active:cursor-grabbing"
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
                        PARTICLE SYSTEM: n={compiledFormula.particleCount}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GenerativeVisualizer;
