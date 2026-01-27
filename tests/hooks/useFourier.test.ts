import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFourier } from '@/hooks/useFourier';
import type { Complex, MathLayer } from '@/types';

// Mock the dft function to avoid heavy computation in tests
vi.mock('@/utils/math', () => ({
    dft: vi.fn((input: Complex[]) => input.map((c, i) => ({
        re: c.re,
        im: c.im,
        freq: i,
        amp: Math.sqrt(c.re * c.re + c.im * c.im),
        phase: Math.atan2(c.im, c.re)
    })))
}));

describe('useFourier', () => {
    it('should return empty array when pathsData is empty', () => {
        const { result } = renderHook(() => useFourier([], []));
        expect(result.current).toEqual([]);
    });

    it('should return empty array when layerConfigs is empty', () => {
        const pathsData: Complex[][] = [[{ re: 1, im: 0 }]];
        const { result } = renderHook(() => useFourier(pathsData, []));
        expect(result.current).toEqual([]);
    });

    it('should compute processed layers for each path', () => {
        const pathsData: Complex[][] = [
            [{ re: 1, im: 0 }, { re: 0, im: 1 }],
            [{ re: 2, im: 0 }, { re: 0, im: 2 }]
        ];
        const layerConfigs: MathLayer[] = [
            { xFn: 'cos(t)', yFn: 'sin(t)', colorHex: '#ff0000' },
            { xFn: 'cos(t)', yFn: 'sin(t)', colorHex: '#00ff00' }
        ];

        const { result } = renderHook(() => useFourier(pathsData, layerConfigs));

        expect(result.current).toHaveLength(2);
        expect(result.current[0].color).toBe('#ff0000');
        expect(result.current[1].color).toBe('#00ff00');
    });

    it('should merge styling from layerConfigs', () => {
        const pathsData: Complex[][] = [[{ re: 1, im: 0 }]];
        const layerConfigs: MathLayer[] = [{
            xFn: 'cos(t)',
            yFn: 'sin(t)',
            colorHex: '#abcdef',
            opacity: 0.5,
            lineWidth: 3,
            fillColor: '#123456'
        }];

        const { result } = renderHook(() => useFourier(pathsData, layerConfigs));

        expect(result.current[0].color).toBe('#abcdef');
        expect(result.current[0].opacity).toBe(0.5);
        expect(result.current[0].lineWidth).toBe(3);
        expect(result.current[0].fillColor).toBe('#123456');
    });

    it('should use default values for optional styling', () => {
        const pathsData: Complex[][] = [[{ re: 1, im: 0 }]];
        const layerConfigs: MathLayer[] = [{
            xFn: 'cos(t)',
            yFn: 'sin(t)',
            colorHex: '#ffffff'
            // opacity and lineWidth not specified
        }];

        const { result } = renderHook(() => useFourier(pathsData, layerConfigs));

        expect(result.current[0].opacity).toBe(1.0);
        expect(result.current[0].lineWidth).toBe(2.0);
    });

    it('should compile modulation function from ampModFn', () => {
        const pathsData: Complex[][] = [[{ re: 1, im: 0 }]];
        const layerConfigs: MathLayer[] = [{
            xFn: 'cos(t)',
            yFn: 'sin(t)',
            colorHex: '#ffffff',
            ampModFn: 't * 2'
        }];

        const { result } = renderHook(() => useFourier(pathsData, layerConfigs));

        expect(result.current[0].modFn(5)).toBe(10);
    });

    it('should fallback to default modFn on invalid ampModFn', () => {
        const pathsData: Complex[][] = [[{ re: 1, im: 0 }]];
        const layerConfigs: MathLayer[] = [{
            xFn: 'cos(t)',
            yFn: 'sin(t)',
            colorHex: '#ffffff',
            ampModFn: 'invalid_syntax((('
        }];

        const { result } = renderHook(() => useFourier(pathsData, layerConfigs));

        // Should fallback to () => 1
        expect(result.current[0].modFn(100)).toBe(1);
    });

    it('should generate stable IDs based on index', () => {
        const pathsData: Complex[][] = [
            [{ re: 1, im: 0 }],
            [{ re: 2, im: 0 }]
        ];
        const layerConfigs: MathLayer[] = [
            { xFn: 'cos(t)', yFn: 'sin(t)', colorHex: '#ff0000' },
            { xFn: 'cos(t)', yFn: 'sin(t)', colorHex: '#00ff00' }
        ];

        const { result } = renderHook(() => useFourier(pathsData, layerConfigs));

        expect(result.current[0].id).toBe('layer-0');
        expect(result.current[1].id).toBe('layer-1');
    });
});
