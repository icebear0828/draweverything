import { Point } from '../types';

// Simple Moore-Neighbor Tracing algorithm to find the external contour
export const extractContourFromImage = (
  imageSrc: string,
  threshold: number = 128
): Promise<Point[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
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
      if (w > MAX_SIZE || h > MAX_SIZE) {
        if (w > h) {
          h = Math.round((h * MAX_SIZE) / w);
          w = MAX_SIZE;
        } else {
          w = Math.round((w * MAX_SIZE) / h);
          h = MAX_SIZE;
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
      const boundary: Point[] = [];
      
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

      // To find the next neighbor, we start scanning clockwise from the backtrack position
      // We need to map (backtrack - current) to an index in neighborOffsets
      
      contour.push({ x: startX, y: startY });

      // Max iterations to prevent infinite loops on complex noise
      let iterations = 0;
      const MAX_ITER = w * h; 

      while (iterations < MAX_ITER) {
          // Find direction of backtrack relative to current
          // We search CLOCKWISE starting from the pixel AFTER the backtrack pixel
          
          let foundNext = false;
          
          // Find index of backtrack vector
          let startSearchIdx = 0;
          // Simple search for the neighbor index that matches backtrack
          for(let i=0; i<8; i++) {
              if (currX + neighborOffsets[i].dx === backtrackX && 
                  currY + neighborOffsets[i].dy === backtrackY) {
                  startSearchIdx = i;
                  break;
              }
          }

          // Scan clockwise
          for (let i = 0; i < 8; i++) {
              const idx = (startSearchIdx + 1 + i) % 8; // Start one after backtrack
              const checkX = currX + neighborOffsets[idx].dx;
              const checkY = currY + neighborOffsets[idx].dy;
              
              if (isForeground(checkX, checkY)) {
                  // Found next boundary pixel
                  contour.push({ x: checkX, y: checkY });
                  
                  // Update backtrack to be the pixel immediately preceding this one in the scan (counter-clockwise)
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
              // Isolated pixel
              break;
          }

          // Stop condition: Back to start (Jacob's stopping criterion is better but simple check works for simple shapes)
          if (currX === startX && currY === startY) {
              break;
          }
          
          iterations++;
      }
      
      // Center the contour
      const cx = contour.reduce((sum, p) => sum + p.x, 0) / contour.length;
      const cy = contour.reduce((sum, p) => sum + p.y, 0) / contour.length;
      
      const centeredContour = contour.map(p => ({
          x: (p.x - cx), // flip y for standard coord system if needed, but canvas is top-left
          y: (p.y - cy)
      }));

      resolve(centeredContour);
    };
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });
};