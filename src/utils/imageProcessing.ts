/**
 * Image Processing Utilities
 * 提供图像轮廓提取功能 (通过 Web Worker)
 */
import type { Point } from '../types';
import { IMAGE_MAX_SIZE, IMAGE_THRESHOLD, IMAGE_PROCESSING_TIMEOUT_MS } from '../constants/config';
import type { ImageProcessingRequest, ImageProcessingResponse } from '../workers/imageProcessing.types';

// ============================================
// Synchronous Fallback Implementation
// ============================================

const CONTOUR_MAX_ITER_MULTIPLIER = 2;
const MIN_CONTOUR_POINTS = 3;

/**
 * 同步轮廓提取 (Worker 不可用时的后备方案)
 */
const extractContourSync = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): Point[] => {
  const isForeground = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * 4;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    return lum < threshold;
  };

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

  if (startX === -1) return [];

  const contour: Point[] = [];
  let currX = startX;
  let currY = startY;
  let backtrackX = startX - 1;
  let backtrackY = startY;

  const neighborOffsets = [
    { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
    { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
  ];

  contour.push({ x: startX, y: startY });

  let iterations = 0;
  const MAX_ITER = width * height * CONTOUR_MAX_ITER_MULTIPLIER;

  while (iterations < MAX_ITER) {
    let foundNext = false;
    let startSearchIdx = 0;

    for (let i = 0; i < 8; i++) {
      if (currX + neighborOffsets[i].dx === backtrackX &&
        currY + neighborOffsets[i].dy === backtrackY) {
        startSearchIdx = i;
        break;
      }
    }

    for (let i = 0; i < 8; i++) {
      const idx = (startSearchIdx + 1 + i) % 8;
      const checkX = currX + neighborOffsets[idx].dx;
      const checkY = currY + neighborOffsets[idx].dy;

      if (isForeground(checkX, checkY)) {
        contour.push({ x: checkX, y: checkY });
        const prevIdx = (idx + 7) % 8;
        backtrackX = currX + neighborOffsets[prevIdx].dx;
        backtrackY = currY + neighborOffsets[prevIdx].dy;
        currX = checkX;
        currY = checkY;
        foundNext = true;
        break;
      }
    }

    if (!foundNext) break;
    if (currX === startX && currY === startY) break;
    iterations++;
  }

  if (contour.length < MIN_CONTOUR_POINTS || contour.length === 0) return [];

  const cx = contour.reduce((sum, p) => sum + p.x, 0) / contour.length;
  const cy = contour.reduce((sum, p) => sum + p.y, 0) / contour.length;

  return contour.map(p => ({ x: p.x - cx, y: p.y - cy }));
};

// ============================================
// Worker Management
// ============================================

let imageWorker: Worker | null = null;
const pendingRequests: Map<string, {
  resolve: (points: Point[]) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}> = new Map();

let requestCounter = 0;
const generateRequestId = () => `img-${++requestCounter}-${Date.now()}`;

/**
 * 初始化 Image Processing Worker
 */
const initWorker = (): Worker | null => {
  if (imageWorker) return imageWorker;

  try {
    imageWorker = new Worker(
      new URL('../workers/imageProcessing.worker.ts', import.meta.url),
      { type: 'module' }
    );

    imageWorker.onmessage = (event: MessageEvent<ImageProcessingResponse>) => {
      const { type, payload } = event.data;

      if (type === 'CONTOUR_RESULT') {
        const request = pendingRequests.get(payload.id);
        if (request) {
          clearTimeout(request.timeoutId);
          request.resolve(payload.contour || []);
          pendingRequests.delete(payload.id);
        }
      } else if (type === 'CONTOUR_ERROR') {
        const request = pendingRequests.get(payload.id);
        if (request) {
          clearTimeout(request.timeoutId);
          request.reject(new Error(payload.message || 'Contour extraction failed'));
          pendingRequests.delete(payload.id);
        }
      }
    };

    imageWorker.onerror = (error) => {
      console.error('Image Worker error:', error);
      pendingRequests.forEach((request) => {
        clearTimeout(request.timeoutId);
        request.reject(new Error('Worker error'));
      });
      pendingRequests.clear();
      imageWorker = null;
    };

    return imageWorker;
  } catch (error) {
    console.warn('Failed to initialize image worker:', error);
    return null;
  }
};

/**
 * 清理 Image Processing Worker
 */
export const cleanupImageWorker = (): void => {
  if (imageWorker) {
    pendingRequests.forEach((request) => {
      clearTimeout(request.timeoutId);
      request.reject(new Error('Worker terminated'));
    });
    pendingRequests.clear();
    imageWorker.terminate();
    imageWorker = null;
  }
};

// HMR 支持
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupImageWorker();
  });
}

// ============================================
// Public API
// ============================================

/**
 * 从图像中提取轮廓 (使用 Web Worker，带同步 fallback)
 */
export const extractContourFromImage = (
  imageSrc: string,
  threshold: number = IMAGE_THRESHOLD
): Promise<Point[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 调整图像尺寸
      let w = img.width;
      let h = img.height;
      if (w > IMAGE_MAX_SIZE || h > IMAGE_MAX_SIZE) {
        const ratio = w / h;
        if (w > h) {
          w = IMAGE_MAX_SIZE;
          h = Math.round(IMAGE_MAX_SIZE / ratio);
        } else {
          h = IMAGE_MAX_SIZE;
          w = Math.round(IMAGE_MAX_SIZE * ratio);
        }
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);

      // 尝试使用 Worker
      const worker = initWorker();
      if (worker) {
        const id = generateRequestId();

        // 设置超时保护
        const timeoutId = setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.get(id)?.reject(
              new Error(`Image processing timeout after ${IMAGE_PROCESSING_TIMEOUT_MS}ms`)
            );
            pendingRequests.delete(id);
          }
        }, IMAGE_PROCESSING_TIMEOUT_MS);

        pendingRequests.set(id, { resolve, reject, timeoutId });

        const request: ImageProcessingRequest = {
          type: 'EXTRACT_CONTOUR',
          payload: {
            id,
            imageData: imageData.data,
            width: w,
            height: h,
            threshold,
          },
        };

        // 使用 transferable 传递数据
        worker.postMessage(request);
      } else {
        // Fallback: 主线程同步处理
        try {
          const contour = extractContourSync(imageData.data, w, h, threshold);
          resolve(contour);
        } catch (error) {
          reject(error);
        }
      }
    };

    img.onerror = (e) => {
      console.error('Image load failed', e);
      reject(new Error('Failed to load image for tracing.'));
    };

    img.src = imageSrc;
  });
};
