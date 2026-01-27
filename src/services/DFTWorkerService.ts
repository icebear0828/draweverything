/**
 * DFT Worker Service
 * 封装 DFT Web Worker 的生命周期和通信
 */
import type { Complex, MathLayer, ProcessedLayer } from '../types';
import type { DFTRequest, DFTResponse, ProcessedLayerData } from '../workers/dft.types';
import { safeCompileExpression } from '../utils/safeEval';
import { dft } from '../utils/math';

const REQUEST_TIMEOUT_MS = 30000;

/**
 * 编译 modFn 字符串为函数
 */
const compileModFn = (fnStr: string): ((t: number) => number) => {
  if (!fnStr) return () => 1;
  return safeCompileExpression<(t: number) => number>(fnStr, ['t'], () => 1);
};

/**
 * 将 ProcessedLayerData 转换为 ProcessedLayer
 */
const compileLayerData = (data: ProcessedLayerData): ProcessedLayer => ({
  id: data.id,
  coefficients: data.coefficients,
  color: data.color,
  fillColor: data.fillColor,
  opacity: data.opacity,
  lineWidth: data.lineWidth,
  modFn: compileModFn(data.modFnStr),
});

/**
 * DFT Worker Service Class
 * 管理 Worker 生命周期和请求/响应
 */
class DFTWorkerService {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, {
    resolve: (layers: ProcessedLayer[]) => void;
    reject: (error: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }> = new Map();
  private requestCounter = 0;

  /**
   * 生成唯一请求 ID
   */
  private generateRequestId(): string {
    return `dft-${++this.requestCounter}-${Date.now()}`;
  }

  /**
   * 初始化 Worker
   */
  init(): Worker | null {
    if (this.worker) return this.worker;

    try {
      this.worker = new Worker(
        new URL('../workers/dft.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<DFTResponse>) => {
        const { type, payload } = event.data;

        if (type === 'DFT_RESULT') {
          const request = this.pendingRequests.get(payload.id);
          if (request) {
            clearTimeout(request.timeoutId);
            const layers = payload.processedLayers.map(compileLayerData);
            request.resolve(layers);
            this.pendingRequests.delete(payload.id);
          }
        } else if (type === 'DFT_ERROR') {
          const request = this.pendingRequests.get(payload.id);
          if (request) {
            clearTimeout(request.timeoutId);
            request.reject(new Error(payload.message));
            this.pendingRequests.delete(payload.id);
          }
        }
        // DFT_PROGRESS 目前忽略，但可用于 UI 更新
      };

      this.worker.onerror = (error) => {
        console.error('DFT Worker error:', error);
        this.pendingRequests.forEach((request) => {
          clearTimeout(request.timeoutId);
          request.reject(new Error('Worker error'));
        });
        this.pendingRequests.clear();
        this.worker = null;
      };

      return this.worker;
    } catch (error) {
      console.warn('Failed to initialize DFT worker:', error);
      return null;
    }
  }

  /**
   * 清理 Worker
   */
  cleanup(): void {
    if (this.worker) {
      this.pendingRequests.forEach((request) => {
        clearTimeout(request.timeoutId);
        request.reject(new Error('Worker terminated'));
      });
      this.pendingRequests.clear();
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * 计算 DFT (异步，使用 Worker)
   */
  async compute(
    pathsData: Complex[][],
    layersConfig: MathLayer[]
  ): Promise<ProcessedLayer[]> {
    const worker = this.init();

    // Fallback 到主线程
    if (!worker) {
      return this.computeSync(pathsData, layersConfig);
    }

    return new Promise((resolve, reject) => {
      const id = this.generateRequestId();

      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.get(id)?.reject(
            new Error(`DFT request timeout after ${REQUEST_TIMEOUT_MS}ms`)
          );
          this.pendingRequests.delete(id);
        }
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(id, { resolve, reject, timeoutId });

      const request: DFTRequest = {
        type: 'COMPUTE_DFT',
        payload: { id, pathsData, layersConfig },
      };

      worker.postMessage(request);
    });
  }

  /**
   * 同步计算 DFT (Worker 不可用时的后备方案)
   */
  private computeSync(
    pathsData: Complex[][],
    layersConfig: MathLayer[]
  ): ProcessedLayer[] {
    if (pathsData.length === 0 || layersConfig.length === 0) {
      return [];
    }

    return pathsData.map((path, index) => {
      const config = layersConfig[index] || layersConfig[0];
      const coefficients = dft(path);

      return {
        id: `layer-${index}`,
        coefficients,
        color: config.colorHex,
        fillColor: config.fillColor,
        opacity: config.opacity ?? 1.0,
        lineWidth: config.lineWidth ?? 2.0,
        modFn: compileModFn(config.ampModFn || '1'),
      };
    });
  }
}

// 单例导出
export const dftWorkerService = new DFTWorkerService();

// HMR 支持
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    dftWorkerService.cleanup();
  });
}
