/**
 * Image Processing Worker Types
 */
import type { Point } from '../types';

export interface ImageProcessingRequest {
  type: 'EXTRACT_CONTOUR';
  payload: {
    id: string;
    imageData: Uint8ClampedArray;
    width: number;
    height: number;
    threshold: number;
  };
}

export interface ImageProcessingResponse {
  type: 'CONTOUR_RESULT' | 'CONTOUR_ERROR';
  payload: {
    id: string;
    contour?: Point[];
    message?: string;
  };
}
