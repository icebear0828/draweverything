/**
 * Data Processor Service
 * 编排数据处理流程
 */
import type { Complex, MathLayer, ProcessedLayer, PresetSampleKey } from '../types';
import { generateFromFunction, resamplePath } from '../utils/math';
import { extractContourFromImage } from '../utils/imageProcessing';
import { generateCharacterImage } from './gemini';
import { dftWorkerService } from './DFTWorkerService';
import { PRESETS } from '../constants/presets';
import { PRESET_URIS } from '../utils/presetShapes';

// ============================================
// Types
// ============================================

export interface ProcessResult {
  pathsData: Complex[][];
  layersConfig: MathLayer[];
  processedLayers: ProcessedLayer[];
}

// ============================================
// Public API
// ============================================

/**
 * 编译数学函数并计算 DFT
 */
export const compileAndProcess = async (
  layersConfig: MathLayer[],
  config: { tMin: number; tMax: number; scale: number; points: number }
): Promise<ProcessResult> => {
  const { tMin, tMax, scale, points } = config;

  const pathsData: Complex[][] = layersConfig.map((layer, index) => {
    const s = layer.scaleMod ? scale * layer.scaleMod : scale;
    const data = generateFromFunction(
      layer.xFn,
      layer.yFn,
      tMin,
      tMax,
      points,
      s,
      true,
      layer.isPolar
    );
    if (data.length === 0) {
      const layerInfo = `Layer ${index + 1}: x(t)="${layer.xFn}", y(t)="${layer.yFn}"`;
      throw new Error(`Empty path generated. ${layerInfo}. Check function syntax.`);
    }
    return data;
  });

  const processedLayers = await dftWorkerService.compute(pathsData, layersConfig);

  return { pathsData, layersConfig, processedLayers };
};

/**
 * 加载预设数据
 */
export const loadPresetData = async (key: string): Promise<ProcessResult | null> => {
  const preset = PRESETS[key];
  if (!preset) return null;

  const pathsData: Complex[][] = [];
  const layersConfig: MathLayer[] = [];

  if (preset.layers && preset.layers.length > 0) {
    preset.layers.forEach((layer) => {
      const s = layer.scaleMod ? preset.scale * layer.scaleMod : preset.scale;
      const data = generateFromFunction(
        layer.xFn,
        layer.yFn,
        preset.tMin,
        preset.tMax,
        2048,
        s,
        false,
        layer.isPolar
      );
      if (data.length > 0) {
        pathsData.push(data);
        layersConfig.push({ ...layer, ampModFn: layer.ampModFn || '1' });
      }
    });
  } else if (preset.xFn && preset.yFn) {
    const data = generateFromFunction(
      preset.xFn,
      preset.yFn,
      preset.tMin,
      preset.tMax,
      2048,
      preset.scale,
      false
    );
    pathsData.push(data);
    layersConfig.push({
      xFn: preset.xFn,
      yFn: preset.yFn,
      colorHex: '#22d3ee',
      opacity: 1,
      lineWidth: 2,
      ampModFn: '1',
    });
  }

  const processedLayers = await dftWorkerService.compute(pathsData, layersConfig);

  return { pathsData, layersConfig, processedLayers };
};

/**
 * 处理图像文件
 */
export const processImageData = async (
  file: File,
  pointCount: number
): Promise<ProcessResult> => {
  const imageSrc = await readFileAsDataURL(file);
  const points = await extractContourFromImage(imageSrc);

  if (points.length < 20) {
    throw new Error('Could not detect a clear path.');
  }

  const complexData = resamplePath(points, pointCount);
  const layersConfig: MathLayer[] = [{
    xFn: 'IMAGE_TRACE',
    yFn: 'IMAGE_TRACE',
    colorHex: '#d946ef',
    opacity: 1,
    lineWidth: 2,
    ampModFn: '1',
  }];

  const processedLayers = await dftWorkerService.compute([complexData], layersConfig);

  return {
    pathsData: [complexData],
    layersConfig,
    processedLayers,
  };
};

/**
 * AI 生成处理
 */
export const processAIData = async (
  prompt: string,
  pointCount: number
): Promise<ProcessResult> => {
  const b64Image = await generateCharacterImage(prompt);
  const points = await extractContourFromImage(b64Image);

  if (points.length < 20) {
    throw new Error('Generated image was too complex to trace.');
  }

  const complexData = resamplePath(points, pointCount);
  const layersConfig: MathLayer[] = [{
    xFn: 'AI_GEN',
    yFn: 'AI_GEN',
    colorHex: '#facc15',
    opacity: 1,
    lineWidth: 2,
    ampModFn: '1',
  }];

  const processedLayers = await dftWorkerService.compute([complexData], layersConfig);

  return {
    pathsData: [complexData],
    layersConfig,
    processedLayers,
  };
};

/**
 * 处理预设示例
 */
export const processSampleData = async (
  key: PresetSampleKey,
  pointCount: number
): Promise<ProcessResult> => {
  const uri = PRESET_URIS[key];
  const points = await extractContourFromImage(uri);

  if (points.length < 20) {
    throw new Error('Could not detect a clear path.');
  }

  const complexData = resamplePath(points, pointCount);
  const layersConfig: MathLayer[] = [{
    xFn: 'IMAGE_TRACE',
    yFn: 'IMAGE_TRACE',
    colorHex: '#fbbf24',
    opacity: 1,
    lineWidth: 3,
    fillColor: '#fbbf2420',
    ampModFn: '1',
  }];

  const processedLayers = await dftWorkerService.compute([complexData], layersConfig);

  return {
    pathsData: [complexData],
    layersConfig,
    processedLayers,
  };
};

// ============================================
// Helpers
// ============================================

/**
 * 读取文件为 Data URL
 */
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => {
      reject(new Error(reader.error?.message || 'File read error'));
    };
    reader.readAsDataURL(file);
  });
};
