
import { Complex, FourierCoefficient, Point } from '../types';

// High-quality resampling to ensure uniform distribution of points along the path
export const resamplePath = (points: Point[], targetCount: number): Complex[] => {
    if (!points || points.length < 2) return [];
    
    // Calculate total length
    let totalLen = 0;
    const dists = [0];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i-1].x;
        const dy = points[i].y - points[i-1].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        totalLen += d;
        dists.push(totalLen);
    }

    // Close the loop distance
    const dx = points[0].x - points[points.length-1].x;
    const dy = points[0].y - points[points.length-1].y;
    const closeDist = Math.sqrt(dx*dx + dy*dy);
    totalLen += closeDist;
    dists.push(totalLen); 
    
    // If path is a single dot or corrupted
    if (totalLen < 0.0001) return Array(targetCount).fill({re: points[0].x, im: points[0].y});

    const extendedPoints = [...points, points[0]];

    const resampled: Complex[] = [];
    // Ensure we don't step beyond bounds
    const step = totalLen / targetCount;
    
    let idx = 0;

    for (let i = 0; i < targetCount; i++) {
        const targetDist = i * step;
        
        // Find segment
        while (idx < dists.length - 2 && dists[idx + 1] <= targetDist) {
            idx++;
        }
        
        // Safe guard
        if (idx >= extendedPoints.length - 1) idx = extendedPoints.length - 2;

        const p1 = extendedPoints[idx];
        const p2 = extendedPoints[idx+1];
        const distStart = dists[idx];
        const distEnd = dists[idx+1];
        const segmentLen = distEnd - distStart;
        
        let t = 0;
        if (segmentLen > 0.000001) {
            t = (targetDist - distStart) / segmentLen;
        }

        resampled.push({
            re: p1.x + (p2.x - p1.x) * t,
            im: p1.y + (p2.y - p1.y) * t
        });
    }

    return resampled;
};

/**
 * Calculates the Discrete Fourier Transform (DFT).
 */
export const dft = (x: Complex[]): FourierCoefficient[] => {
  const X: FourierCoefficient[] = [];
  const N = x.length;
  if (N === 0) return [];

  // Optimization: For visualization, we often don't need all N coefficients if N is huge (2000+).
  // However, removing them changes the shape. We'll keep them but might consider filtering later.

  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;

    const angleConst = (2 * Math.PI * k) / N;

    for (let n = 0; n < N; n++) {
      const phi = angleConst * n;
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      
      re += x[n].re * cos + x[n].im * sin;
      im += x[n].im * cos - x[n].re * sin;
    }

    re = re / N;
    im = im / N;

    const freq = k > N / 2 ? k - N : k;
    const amp = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);

    X.push({ re, im, freq, amp, phase });
  }

  return X.sort((a, b) => b.amp - a.amp);
};

// --- DYNAMIC FUNCTION GENERATION ---

export const generateFromFunction = (
    fn1Str: string, // x(t) or r(t)
    fn2Str: string, // y(t) or theta(t)
    tMin: number, 
    tMax: number, 
    points: number,
    scale: number,
    shouldCenter: boolean = false,
    isPolar: boolean = false
): Complex[] => {
    const path: Complex[] = [];
    
    // Create functions from strings safely
    // We bind 't' as argument
    let fn1: Function, fn2: Function;
    
    try {
        // eslint-disable-next-line no-new-func
        fn1 = new Function('t', `return ${fn1Str};`);
        // eslint-disable-next-line no-new-func
        fn2 = new Function('t', `return ${fn2Str};`);
    } catch (e) {
        console.error("Invalid function string", e);
        return [];
    }

    for (let i = 0; i < points; i++) {
        const t = tMin + (tMax - tMin) * (i / points);
        try {
            const val1 = fn1(t);
            const val2 = fn2(t);
            if (isNaN(val1) || isNaN(val2)) continue;
            
            let x, y;

            if (isPolar) {
                // val1 = r, val2 = theta
                x = val1 * Math.cos(val2);
                y = val1 * Math.sin(val2);
            } else {
                // val1 = x, val2 = y
                x = val1;
                y = val2;
            }
            
            // Standardize coordinate system: Y is usually up in math, but down in Canvas.
            // We flip Y here to make "up" up.
            path.push({ re: x * scale, im: -y * scale }); 
        } catch (e) {
            continue;
        }
    }
    
    if (path.length === 0) return [];

    // Auto-centering logic for manual functions
    if (shouldCenter) {
        const sum = path.reduce((acc, p) => ({ re: acc.re + p.re, im: acc.im + p.im }), { re: 0, im: 0 });
        const center = { re: sum.re / path.length, im: sum.im / path.length };
        
        for (let i = 0; i < path.length; i++) {
            path[i].re -= center.re;
            path[i].im -= center.im;
        }
    }
    
    // We rely on the large point count for smoothness, 
    // no resampling needed for pure math functions unless they are non-uniform speed.
    // However, resampling helps distributing FFT weights better if the curve speed varies wildly.
    // Let's resample to be safe for uniform time steps in FFT.
    const pointObj = path.map(p => ({x: p.re, y: p.im}));
    return resamplePath(pointObj, points);
};
