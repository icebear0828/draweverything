
import { Point } from '../types';

// Simple Moore-Neighbor Tracing algorithm to find the external contour
export const extractContourFromImage = (
  imageSrc: string,
  threshold: number = 128
): Promise<Point[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Enable CORS to allow processing if imageSrc is external, though usually it is base64 here.
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Canvas context not available');
        return;
      }

      // Resize for performance/consistency. 
      // Too huge images make tracing slow and produce too many points.
      const MAX_SIZE = 512;
      let w = img.width;
      let h = img.height;
      
      // Maintain aspect ratio
      if (w > MAX_SIZE || h > MAX_SIZE) {
        const ratio = w / h;
        if (w > h) {
          w = MAX_SIZE;
          h = Math.round(MAX_SIZE / ratio);
        } else {
          h = MAX_SIZE;
          w = Math.round(MAX_SIZE * ratio);
        }
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const width = w;
      const height = h;

      // Helper to check if pixel is "foreground" (dark in our case, assuming white background)
      const isForeground = (x: number, y: number): boolean => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        const idx = (y * width + x) * 4;
        // Calculate luminance
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        return lum < threshold; 
      };

      // 1. Find starting point (first black pixel)
      let startX = -1;
      let startY = -1;
      
      outerLoop:
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (isForeground(x, y)) {
            startX = x;
            startY = y;
            break outerLoop;
          }
        }
      }

      if (startX === -1) {
        resolve([]); // No object found
        return;
      }

      // 2. Moore-Neighbor Tracing
      const contour: Point[] = [];
      
      let currX = startX;
      let currY = startY;
      let backtrackX = startX - 1; // Enter from West
      let backtrackY = startY;
      
      // Directions: N, NE, E, SE, S, SW, W, NW
      // Offset from current
      const neighborOffsets = [
        { dx: 0, dy: -1 }, // N
        { dx: 1, dy: -1 }, // NE
        { dx: 1, dy: 0 },  // E
        { dx: 1, dy: 1 },  // SE
        { dx: 0, dy: 1 },  // S
        { dx: -1, dy: 1 }, // SW
        { dx: -1, dy: 0 }, // W
        { dx: -1, dy: -1 } // NW
      ];

      contour.push({ x: startX, y: startY });

      // Max iterations to prevent infinite loops on complex noise
      let iterations = 0;
      const MAX_ITER = w * h * 2; // Allow some overlap for complex shapes, but limit it.

      while (iterations < MAX_ITER) {
          // Find direction of backtrack relative to current
          // We search CLOCKWISE starting from the pixel AFTER the backtrack pixel
          
          let foundNext = false;
          let startSearchIdx = 0;

          // Find which neighbor index corresponds to backtrack
          // If backtrack is not a direct neighbor (can happen in rare single-pixel skips), default to 0
          for(let i=0; i<8; i++) {
             if (currX + neighborOffsets[i].dx === backtrackX && 
                 currY + neighborOffsets[i].dy === backtrackY) {
                 startSearchIdx = i;
                 break;
             }
          }

          // Scan clockwise around current pixel
          for (let i = 0; i < 8; i++) {
              const idx = (startSearchIdx + 1 + i) % 8; // Start one after backtrack
              const checkX = currX + neighborOffsets[idx].dx;
              const checkY = currY + neighborOffsets[idx].dy;
              
              if (isForeground(checkX, checkY)) {
                  // Found next boundary pixel
                  contour.push({ x: checkX, y: checkY });
                  
                  // Update backtrack to be the pixel immediately preceding this one in the scan
                  // The one we just came from effectively becomes the new backtrack for the next step, 
                  // but specifically the "white" pixel we scanned just before finding the black one.
                  const prevIdx = (idx + 7) % 8; // (idx - 1 + 8) % 8
                  backtrackX = currX + neighborOffsets[prevIdx].dx;
                  backtrackY = currY + neighborOffsets[prevIdx].dy;
                  
                  currX = checkX;
                  currY = checkY;
                  foundNext = true;
                  break;
              }
          }
          
          if (!foundNext) {
              // Isolated pixel or trapped
              break;
          }

          // Stop condition: Back to start
          // We check if we are at start AND the next backtrack direction is the same as initial
          // But simple coord check is usually enough for visualizer purposes
          if (currX === startX && currY === startY) {
              break;
          }
          
          iterations++;
      }
      
      if (contour.length < 3) {
          resolve([]);
          return;
      }

      // Center the contour
      const cx = contour.reduce((sum, p) => sum + p.x, 0) / contour.length;
      const cy = contour.reduce((sum, p) => sum + p.y, 0) / contour.length;
      
      // Invert Y for standard math coordinates if desired, but here we just center
      // Note: Canvas Y is down, Math Y is up. The visualizer handles the flip usually via scale(-1) or logic.
      // Here we provide raw image coords centered.
      const centeredContour = contour.map(p => ({
          x: (p.x - cx), 
          y: (p.y - cy)
      }));

      resolve(centeredContour);
    };
    
    img.onerror = (e) => {
        // Fallback for some CORS or load errors
        console.error("Image load failed", e);
        reject("Failed to load image for tracing.");
    };
    
    img.src = imageSrc;
  });
};
