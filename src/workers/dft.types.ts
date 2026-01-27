/**
 * DFT Worker Types
 * Worker 通信消息类型定义
 */

import { Complex, FourierCoefficient, MathLayer, ProcessedLayer } from '../types';

// ============================================
// Request Messages (Main -> Worker)
// ============================================

export interface DFTComputeRequest {
  type: 'COMPUTE_DFT';
  payload: {
    id: string; // Request ID for correlation
    pathsData: Complex[][];
    layersConfig: MathLayer[];
  };
}

export type DFTRequest = DFTComputeRequest;

// ============================================
// Response Messages (Worker -> Main)
// ============================================

export interface DFTResultResponse {
  type: 'DFT_RESULT';
  payload: {
    id: string; // Request ID for correlation
    processedLayers: ProcessedLayerData[];
  };
}

export interface DFTErrorResponse {
  type: 'DFT_ERROR';
  payload: {
    id: string; // Request ID for correlation
    message: string;
  };
}

export interface DFTProgressResponse {
  type: 'DFT_PROGRESS';
  payload: {
    id: string;
    progress: number; // 0-100
    message: string;
  };
}

export type DFTResponse = DFTResultResponse | DFTErrorResponse | DFTProgressResponse;

// ============================================
// Data Transfer Types
// ============================================

/**
 * Serializable version of ProcessedLayer for Worker transfer
 * Note: modFn cannot be transferred, so we include modFnStr instead
 */
export interface ProcessedLayerData {
  id: string;
  coefficients: FourierCoefficient[];
  color: string;
  fillColor?: string;
  opacity: number;
  lineWidth: number;
  modFnStr: string; // Source string for modFn, compiled on main thread
}
