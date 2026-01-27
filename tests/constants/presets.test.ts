import { describe, it, expect } from 'vitest';
import { PRESETS } from '@/constants/presets';

describe('PRESETS', () => {
    it('should have multiple presets defined', () => {
        const presetKeys = Object.keys(PRESETS);
        expect(presetKeys.length).toBeGreaterThan(0);
    });

    it('should have required properties for each preset', () => {
        Object.entries(PRESETS).forEach(([key, preset]) => {
            expect(preset).toHaveProperty('label');
            expect(preset).toHaveProperty('tMin');
            expect(preset).toHaveProperty('tMax');
            expect(preset).toHaveProperty('scale');
            expect(typeof preset.label).toBe('string');
            expect(typeof preset.tMin).toBe('number');
            expect(typeof preset.tMax).toBe('number');
            expect(typeof preset.scale).toBe('number');
        });
    });

    it('should have valid function strings or layers for each preset', () => {
        Object.entries(PRESETS).forEach(([key, preset]) => {
            // Either has xFn/yFn OR has layers
            const hasDirectFunctions = preset.xFn && preset.yFn;
            const hasLayers = preset.layers && preset.layers.length > 0;
            const isParticleRenderer = preset.renderer === 'PARTICLE';

            // Particle renderers are special and may have empty layers
            if (!isParticleRenderer) {
                expect(hasDirectFunctions || hasLayers).toBe(true);
            }
        });
    });

    it('should have valid layer configurations when layers are defined', () => {
        Object.entries(PRESETS).forEach(([key, preset]) => {
            if (preset.layers) {
                preset.layers.forEach((layer, index) => {
                    expect(layer).toHaveProperty('xFn');
                    expect(layer).toHaveProperty('yFn');
                    expect(layer).toHaveProperty('colorHex');
                    expect(typeof layer.xFn).toBe('string');
                    expect(typeof layer.yFn).toBe('string');
                    expect(layer.colorHex).toMatch(/^#[0-9a-fA-F]{6}$/);
                });
            }
        });
    });

    it('should have tMax greater than tMin', () => {
        Object.entries(PRESETS).forEach(([key, preset]) => {
            expect(preset.tMax).toBeGreaterThan(preset.tMin);
        });
    });

    it('should have positive scale values', () => {
        Object.entries(PRESETS).forEach(([key, preset]) => {
            expect(preset.scale).toBeGreaterThan(0);
        });
    });
});
