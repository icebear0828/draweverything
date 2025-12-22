
export interface Complex {
  re: number;
  im: number;
}

export interface FourierCoefficient {
  re: number;
  im: number;
  freq: number;
  amp: number;
  phase: number;
}

export interface Point {
  x: number;
  y: number;
}

export enum AppMode {
  FUNCTION = 'FUNCTION',
  IMAGE_UPLOAD = 'IMAGE_UPLOAD',
  AI_GENERATE = 'AI_GENERATE',
}

// 1. User Configuration (Input)
export interface MathLayer {
  xFn: string;
  yFn: string;
  colorHex: string; 
  scaleMod?: number; // Modify global scale for this layer
  opacity?: number;  // 0.0 to 1.0
  lineWidth?: number; // for emphasis
  fillColor?: string; // Hex color for filling
  ampModFn?: string; // String function to modulate amplitude
}

// 2. Processed Data (Ready for Renderer)
export interface ProcessedLayer {
  id: string; // Unique identifier for React keys
  coefficients: FourierCoefficient[];
  color: string;
  fillColor?: string;
  opacity: number;
  lineWidth: number;
  modFn: (t: number) => number; // Compiled function
}

// Preset definition
export interface PresetDef {
  label: string;
  xFn?: string;
  yFn?: string;
  layers?: MathLayer[]; 
  tMin: number;
  tMax: number;
  scale: number;
}
