import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePathGenerator } from '../../hooks/usePathGenerator';
import { PresetDef } from '../../types';

// Mock all dependencies
vi.mock('../../utils/math', () => ({
    generateFromFunction: vi.fn((xFn, yFn, tMin, tMax, points, scale) => {
        if (xFn.includes('invalid')) return [];
        return Array(points).fill(null).map((_, i) => ({
            re: Math.cos(2 * Math.PI * i / points) * scale,
            im: Math.sin(2 * Math.PI * i / points) * scale
        }));
    }),
    resamplePath: vi.fn((points, count) =>
        Array(count).fill(null).map((_, i) => ({
            re: i / count,
            im: i / count
        }))
    )
}));

vi.mock('../../utils/imageProcessing', () => ({
    extractContourFromImage: vi.fn(() => Promise.resolve(
        Array(100).fill(null).map((_, i) => ({ x: i, y: i }))
    ))
}));

vi.mock('../../services/gemini', () => ({
    generateCharacterImage: vi.fn(() => Promise.resolve('data:image/png;base64,mockdata'))
}));

vi.mock('../../constants/presets', () => ({
    PRESETS: {
        TEST_PRESET: {
            label: 'Test Preset',
            xFn: 'Math.cos(t)',
            yFn: 'Math.sin(t)',
            tMin: 0,
            tMax: 6.28,
            scale: 100
        },
        MULTI_LAYER_PRESET: {
            label: 'Multi Layer',
            layers: [
                { xFn: 'Math.cos(t)', yFn: 'Math.sin(t)', colorHex: '#ff0000' },
                { xFn: 'Math.cos(2*t)', yFn: 'Math.sin(2*t)', colorHex: '#00ff00' }
            ],
            tMin: 0,
            tMax: 6.28,
            scale: 50
        }
    }
}));

vi.mock('../../utils/presetShapes', () => ({
    PRESET_URIS: {
        PIKACHU: 'data:image/svg+xml;base64,mocksvg'
    }
}));

describe('usePathGenerator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('should initialize with empty arrays and no error', () => {
            const { result } = renderHook(() => usePathGenerator());

            expect(result.current.pathsData).toEqual([]);
            expect(result.current.layersConfig).toEqual([]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(null);
        });
    });

    describe('compileFunctions', () => {
        it('should generate paths from math functions', async () => {
            const { result } = renderHook(() => usePathGenerator());

            const layers = [
                { xFn: 'Math.cos(t)', yFn: 'Math.sin(t)', colorHex: '#ffffff' }
            ];

            act(() => {
                result.current.compileFunctions(layers, 0, 6.28, 100, 50);
            });

            // Wait for async processing
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.pathsData.length).toBeGreaterThan(0);
            expect(result.current.error).toBe(null);
        });

        it('should set error on invalid function syntax', async () => {
            const { result } = renderHook(() => usePathGenerator());

            const layers = [
                { xFn: 'invalid_syntax', yFn: 'Math.sin(t)', colorHex: '#ffffff' }
            ];

            act(() => {
                result.current.compileFunctions(layers, 0, 6.28, 100, 50);
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Should have error (empty path produces error)
            expect(result.current.error).not.toBe(null);
        });
    });

    describe('loadPreset', () => {
        it('should load preset and generate paths', async () => {
            const { result } = renderHook(() => usePathGenerator());

            let presetResult: PresetDef | null;
            await act(async () => {
                presetResult = await result.current.loadPreset('TEST_PRESET');
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(presetResult).not.toBe(null);
            expect(presetResult?.label).toBe('Test Preset');
            expect(result.current.pathsData.length).toBeGreaterThan(0);
        });

        it('should return null for unknown preset', async () => {
            const { result } = renderHook(() => usePathGenerator());

            let presetResult: PresetDef | null;
            await act(async () => {
                presetResult = await result.current.loadPreset('UNKNOWN_PRESET');
            });

            expect(presetResult).toBe(null);
        });

        it('should handle multi-layer presets', async () => {
            const { result } = renderHook(() => usePathGenerator());

            await act(async () => {
                await result.current.loadPreset('MULTI_LAYER_PRESET');
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.pathsData.length).toBe(2);
            expect(result.current.layersConfig.length).toBe(2);
        });
    });

    describe('resetError', () => {
        it('should clear error state', async () => {
            const { result } = renderHook(() => usePathGenerator());

            // Trigger an error
            act(() => {
                result.current.compileFunctions(
                    [{ xFn: 'invalid_syntax', yFn: 'a', colorHex: '#fff' }],
                    0, 1, 1, 10
                );
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Reset the error
            act(() => {
                result.current.resetError();
            });

            expect(result.current.error).toBe(null);
        });
    });
});
