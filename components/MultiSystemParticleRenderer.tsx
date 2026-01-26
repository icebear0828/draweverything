/**
 * Multi-System Particle Renderer
 * 
 * Renders multiple particle expression systems with composition support
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { useCanvasControls } from '../hooks/useCanvasControls';
import {
    ParticleExpressionSystem,
    CompiledParticleSystem,
    ParticlePreset
} from '../types/particle';
import { compileParticleExpressionSystem, executeParticle } from '../utils/particle';

interface MultiSystemParticleRendererProps {
    /** Single system or full preset with multiple systems */
    preset?: ParticlePreset;
    /** Single system (convenience prop) */
    system?: ParticleExpressionSystem;
    /** Is animation running */
    isRunning: boolean;
    /** Speed multiplier */
    speed: number;
}

const MultiSystemParticleRenderer: React.FC<MultiSystemParticleRendererProps> = ({
    preset,
    system,
    isRunning,
    speed
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timeRef = useRef(0);
    const animationFrameRef = useRef(0);

    // Compile systems
    const compiledSystems = useMemo<CompiledParticleSystem[]>(() => {
        if (preset) {
            return preset.systems.map(s => compileParticleExpressionSystem(s));
        }
        if (system) {
            return [compileParticleExpressionSystem(system)];
        }
        // Default spiral galaxy
        return [compileParticleExpressionSystem({
            definitions: {
                r_base: 'Math.pow(n, 1.5) / (n + 1000)',
                wave: 'Math.sin(0.1 * n * Math.sin(83.333 * t))',
                r: 'r_base * (1 + 0.3 * wave)',
                theta: '0.1 * n * t'
            },
            output: {
                x: 'r * Math.cos(theta)',
                y: 'r * Math.sin(theta)',
                alpha: '0.3 + 0.7 * Math.abs(wave)'
            },
            particleCount: 4000,
            timeScale: 0.0002,
            colorHex: '#ffffff'
        })];
    }, [preset, system]);

    // Blend mode
    const blendMode = preset?.blendMode ?? 'normal';
    const backgroundColor = preset?.backgroundColor ?? '#050505';

    // Keep ref for animation loop
    const systemsRef = useRef(compiledSystems);
    useEffect(() => {
        systemsRef.current = compiledSystems;
    }, [compiledSystems]);

    // Canvas controls
    const {
        zoomRef,
        panRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        setupWheelHandler
    } = useCanvasControls();

    // Setup wheel handler
    useEffect(() => {
        return setupWheelHandler(canvasRef.current);
    }, [setupWheelHandler]);

    // Resize observer
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

    // Animation loop
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
            const systems = systemsRef.current;

            // Clear
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);

            // Set blend mode
            if (blendMode === 'additive') {
                ctx.globalCompositeOperation = 'lighter';
            } else {
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.translate((width / dpr) / 2 + currentPan.x, (height / dpr) / 2 + currentPan.y);
            ctx.scale(currentZoom * 4, currentZoom * 4);

            const t = timeRef.current;

            // Render each system
            for (const compiledSystem of systems) {
                const particleCount = compiledSystem.particleCount;

                for (let n = 1; n < particleCount; n++) {
                    try {
                        const particle = executeParticle(compiledSystem, n, t);

                        // Set color and alpha
                        ctx.fillStyle = particle.color;
                        ctx.globalAlpha = Math.max(0, Math.min(1, particle.alpha));

                        const size = (particle.size * 0.8) / currentZoom;

                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, Math.max(0.5, size), 0, 2 * Math.PI);
                        ctx.fill();
                    } catch {
                        // Skip particles that error (shouldn't happen with proper validation)
                    }
                }
            }

            ctx.restore();
            ctx.globalCompositeOperation = 'source-over';

            // Time step (use first system's timeScale)
            if (isRunning && systems.length > 0) {
                timeRef.current += systems[0].timeScale * speed;
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isRunning, speed, zoomRef, panRef, blendMode, backgroundColor]);

    // Count total particles
    const totalParticles = compiledSystems.reduce((sum, s) => sum + s.particleCount, 0);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative cursor-move active:cursor-grabbing"
            style={{ backgroundColor }}
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
                        PARTICLE SYSTEMS: {compiledSystems.length} | PARTICLES: {totalParticles}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MultiSystemParticleRenderer;
