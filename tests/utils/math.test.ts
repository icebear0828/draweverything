import { describe, it, expect } from 'vitest';
import { resamplePath, dft, generateFromFunction } from '../../utils/math';
import type { Point, Complex } from '../../types';

describe('resamplePath', () => {
    it('should return empty array for less than 2 points', () => {
        expect(resamplePath([], 10)).toEqual([]);
        expect(resamplePath([{ x: 0, y: 0 }], 10)).toEqual([]);
    });

    it('should return correct number of points', () => {
        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const result = resamplePath(points, 8);
        expect(result).toHaveLength(8);
    });

    it('should handle closed loop correctly', () => {
        // Square path
        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 }
        ];
        const result = resamplePath(points, 4);
        expect(result).toHaveLength(4);
        // First and last should be near corners
        expect(result[0].re).toBeCloseTo(0, 1);
        expect(result[0].im).toBeCloseTo(0, 1);
    });

    it('should return array of Complex type with re and im properties', () => {
        const points: Point[] = [
            { x: 5, y: 10 },
            { x: 15, y: 20 }
        ];
        const result = resamplePath(points, 3);
        result.forEach(p => {
            expect(p).toHaveProperty('re');
            expect(p).toHaveProperty('im');
        });
    });
});

describe('dft', () => {
    it('should return empty array for empty input', () => {
        expect(dft([])).toEqual([]);
    });

    it('should return same number of coefficients as input points', () => {
        const input: Complex[] = [
            { re: 1, im: 0 },
            { re: 0, im: 1 },
            { re: -1, im: 0 },
            { re: 0, im: -1 }
        ];
        const result = dft(input);
        expect(result).toHaveLength(input.length);
    });

    it('should return coefficients sorted by amplitude (descending)', () => {
        const input: Complex[] = [
            { re: 1, im: 0 },
            { re: 0, im: 1 },
            { re: -1, im: 0 },
            { re: 0, im: -1 }
        ];
        const result = dft(input);
        for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].amp).toBeGreaterThanOrEqual(result[i].amp);
        }
    });

    it('should have freq, amp, and phase properties on coefficients', () => {
        const input: Complex[] = [{ re: 1, im: 0 }, { re: 0, im: 1 }];
        const result = dft(input);
        result.forEach(coeff => {
            expect(coeff).toHaveProperty('freq');
            expect(coeff).toHaveProperty('amp');
            expect(coeff).toHaveProperty('phase');
            expect(coeff).toHaveProperty('re');
            expect(coeff).toHaveProperty('im');
        });
    });

    it('should compute correct DFT for simple signal', () => {
        // DC signal (constant)
        const dc: Complex[] = [
            { re: 2, im: 0 },
            { re: 2, im: 0 },
            { re: 2, im: 0 },
            { re: 2, im: 0 }
        ];
        const result = dft(dc);
        // DC component should have amplitude 2
        const dcComponent = result.find(c => c.freq === 0);
        expect(dcComponent).toBeDefined();
        expect(dcComponent!.amp).toBeCloseTo(2, 5);
    });
});

describe('generateFromFunction', () => {
    it('should generate circle from cos/sin functions', () => {
        const result = generateFromFunction(
            'Math.cos(t)',
            'Math.sin(t)',
            0,
            2 * Math.PI,
            100,
            1,
            false,
            false
        );
        expect(result.length).toBeGreaterThan(0);
        // All points should be on unit circle (radius ~1)
        result.forEach(p => {
            const radius = Math.sqrt(p.re * p.re + p.im * p.im);
            expect(radius).toBeCloseTo(1, 1);
        });
    });

    it('should handle polar coordinates', () => {
        // r = 1, theta = t (constant radius circle in polar)
        const result = generateFromFunction(
            '1',        // r(t) = 1
            't',        // theta(t) = t
            0,
            2 * Math.PI,  // Full circle
            50,
            1,
            false,
            true  // isPolar = true
        );
        expect(result.length).toBeGreaterThan(0);
        // All points should have radius ~1 (with scale=1)
        // Note: generateFromFunction applies resampling which maintains the shape
        result.forEach(p => {
            const radius = Math.sqrt(p.re * p.re + p.im * p.im);
            expect(radius).toBeCloseTo(1, 0); // Allow tolerance due to resampling
        });
    });

    it('should return empty array for invalid function string', () => {
        const result = generateFromFunction(
            'invalid_syntax(((',
            'Math.sin(t)',
            0,
            2 * Math.PI,
            100,
            1
        );
        expect(result).toEqual([]);
    });

    it('should apply scale correctly', () => {
        const scale = 10;
        const result = generateFromFunction(
            'Math.cos(t)',
            'Math.sin(t)',
            0,
            2 * Math.PI,
            100,
            scale,
            false,
            false
        );
        // Points should be on circle with radius ~scale
        result.forEach(p => {
            const radius = Math.sqrt(p.re * p.re + p.im * p.im);
            expect(radius).toBeCloseTo(scale, 1);
        });
    });

    it('should center output when shouldCenter is true', () => {
        // Offset circle
        const result = generateFromFunction(
            '10 + Math.cos(t)',  // x offset by 10
            'Math.sin(t)',
            0,
            2 * Math.PI,
            100,
            1,
            true,  // shouldCenter
            false
        );
        // Center should be near origin after centering
        const avgRe = result.reduce((sum, p) => sum + p.re, 0) / result.length;
        const avgIm = result.reduce((sum, p) => sum + p.im, 0) / result.length;
        expect(avgRe).toBeCloseTo(0, 0);
        expect(avgIm).toBeCloseTo(0, 0);
    });
});
