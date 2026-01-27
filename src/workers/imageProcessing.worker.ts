/**
 * Image Processing Web Worker
 * 在后台线程执行 CPU 密集型轮廓提取
 */
import type { Point } from '../types';
import type { ImageProcessingRequest, ImageProcessingResponse } from './imageProcessing.types';

// 常量直接定义在 Worker 中，避免跨文件导入问题
const CONTOUR_MAX_ITER_MULTIPLIER = 2;
const MIN_CONTOUR_POINTS = 3;
/** 轮廓追踪绝对上限 (防止极端细长图像导致过长处理时间) */
const MAX_CONTOUR_ITERATIONS = 500000;

/**
 * Moore-Neighbor Tracing 算法核心逻辑
 */
const extractContourFromImageData = (
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

  // 查找起始点
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

  // Moore-Neighbor Tracing
  const contour: Point[] = [];
  let currX = startX;
  let currY = startY;
  let backtrackX = startX - 1;
  let backtrackY = startY;

  const neighborOffsets = [
    { dx: 0, dy: -1 },  // N
    { dx: 1, dy: -1 },  // NE
    { dx: 1, dy: 0 },   // E
    { dx: 1, dy: 1 },   // SE
    { dx: 0, dy: 1 },   // S
    { dx: -1, dy: 1 },  // SW
    { dx: -1, dy: 0 },  // W
    { dx: -1, dy: -1 }  // NW
  ];

  contour.push({ x: startX, y: startY });

  let iterations = 0;
  const MAX_ITER = Math.min(
    width * height * CONTOUR_MAX_ITER_MULTIPLIER,
    MAX_CONTOUR_ITERATIONS
  );

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

  if (contour.length < MIN_CONTOUR_POINTS) return [];
  if (contour.length === 0) return [];

  // 中心化
  const cx = contour.reduce((sum, p) => sum + p.x, 0) / contour.length;
  const cy = contour.reduce((sum, p) => sum + p.y, 0) / contour.length;

  return contour.map(p => ({
    x: p.x - cx,
    y: p.y - cy
  }));
};

// Worker message handler
self.onmessage = (event: MessageEvent<ImageProcessingRequest>) => {
  const { type, payload } = event.data;

  if (type === 'EXTRACT_CONTOUR') {
    try {
      const { id, imageData, width, height, threshold } = payload;
      const contour = extractContourFromImageData(imageData, width, height, threshold);

      const response: ImageProcessingResponse = {
        type: 'CONTOUR_RESULT',
        payload: { id, contour }
      };
      self.postMessage(response);
    } catch (error) {
      const response: ImageProcessingResponse = {
        type: 'CONTOUR_ERROR',
        payload: {
          id: payload.id,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      self.postMessage(response);
    }
  }
};
