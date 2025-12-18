
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

// Defines a single layer of a mathematical composition
export interface MathLayer {
  xFn: string;
  yFn: string;
  colorHex: string; 
  scaleMod?: number; // Modify global scale for this layer
  opacity?: number;  // 0.0 to 1.0
  lineWidth?: number; // for emphasis
  fillColor?: string; // New: Hex color for filling the shape (optional)
  ampModFn?: string; // New: Function string to modulate amplitude over time
}

// Preset definition
export interface PresetDef {
  label: string;
  // Legacy/Single mode support
  xFn?: string;
  yFn?: string;
  // Multi-layer support
  layers?: MathLayer[]; 
  tMin: number;
  tMax: number;
  scale: number;
}
