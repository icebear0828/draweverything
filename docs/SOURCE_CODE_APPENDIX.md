# 附录：完整源代码 (Complete Source Code Appendix)

> [!IMPORTANT]
> 本附录包含项目所有源文件的完整代码，按照依赖顺序排列，可直接用于从零复刻项目。

---

## 目录

1. [配置文件](#1-配置文件)
2. [入口文件](#2-入口文件)
3. [类型定义](#3-类型定义)
4. [工具函数](#4-工具函数)
5. [服务层](#5-服务层)
6. [常量数据](#6-常量数据)
7. [Hooks](#7-hooks)
8. [组件](#8-组件)
9. [主应用](#9-主应用)

---

## 1. 配置文件

### 1.1 `package.json`

```json
{
  "name": "fourier-architect",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "@google/genai": "^1.33.0",
    "lucide-react": "^0.561.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

### 1.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["node"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

### 1.3 `vite.config.ts`

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

### 1.4 `.env.example`

```
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 2. 入口文件

### 2.1 `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fourier Architect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        margin: 0;
        background-color: #09090b;
        color: #e4e4e7;
        font-family: 'Inter', sans-serif;
        overflow: hidden;
      }
      /* Custom Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #18181b; 
      }
      ::-webkit-scrollbar-thumb {
        background: #3f3f46; 
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #52525b; 
      }
    </style>
  <script type="importmap">
{
  "imports": {
    "react/": "https://esm.sh/react@^19.2.3/",
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "@google/genai": "https://esm.sh/@google/genai@^1.33.0",
    "lucide-react": "https://esm.sh/lucide-react@^0.561.0"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### 2.2 `index.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 3. 类型定义

### 3.1 `types.ts`

```typescript
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
  xFn: string; // Used for x(t) OR r(t)
  yFn: string; // Used for y(t) OR theta(t)
  isPolar?: boolean; // Toggle between Cartesian and Polar
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
  renderer?: 'FOURIER' | 'PARTICLE';
}
```

---

## 4. 工具函数

### 4.1 `utils/math.ts`

```typescript
import { Complex, FourierCoefficient, Point } from '../types';

// High-quality resampling to ensure uniform distribution of points along the path
export const resamplePath = (points: Point[], targetCount: number): Complex[] => {
    if (!points || points.length < 2) return [];
    
    // Calculate total length
    let totalLen = 0;
    const dists = [0];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i-1].x;
        const dy = points[i].y - points[i-1].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        totalLen += d;
        dists.push(totalLen);
    }

    // Close the loop distance
    const dx = points[0].x - points[points.length-1].x;
    const dy = points[0].y - points[points.length-1].y;
    const closeDist = Math.sqrt(dx*dx + dy*dy);
    totalLen += closeDist;
    dists.push(totalLen); 
    
    if (totalLen < 0.0001) return Array(targetCount).fill({re: points[0].x, im: points[0].y});

    const extendedPoints = [...points, points[0]];
    const resampled: Complex[] = [];
    const step = totalLen / targetCount;
    let idx = 0;

    for (let i = 0; i < targetCount; i++) {
        const targetDist = i * step;
        
        while (idx < dists.length - 2 && dists[idx + 1] <= targetDist) {
            idx++;
        }
        
        if (idx >= extendedPoints.length - 1) idx = extendedPoints.length - 2;

        const p1 = extendedPoints[idx];
        const p2 = extendedPoints[idx+1];
        const distStart = dists[idx];
        const distEnd = dists[idx+1];
        const segmentLen = distEnd - distStart;
        
        let t = 0;
        if (segmentLen > 0.000001) {
            t = (targetDist - distStart) / segmentLen;
        }

        resampled.push({
            re: p1.x + (p2.x - p1.x) * t,
            im: p1.y + (p2.y - p1.y) * t
        });
    }

    return resampled;
};

/**
 * Calculates the Discrete Fourier Transform (DFT).
 */
export const dft = (x: Complex[]): FourierCoefficient[] => {
  const X: FourierCoefficient[] = [];
  const N = x.length;
  if (N === 0) return [];

  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;

    const angleConst = (2 * Math.PI * k) / N;

    for (let n = 0; n < N; n++) {
      const phi = angleConst * n;
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      
      re += x[n].re * cos + x[n].im * sin;
      im += x[n].im * cos - x[n].re * sin;
    }

    re = re / N;
    im = im / N;

    const freq = k > N / 2 ? k - N : k;
    const amp = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);

    X.push({ re, im, freq, amp, phase });
  }

  return X.sort((a, b) => b.amp - a.amp);
};

export const generateFromFunction = (
    fn1Str: string,
    fn2Str: string,
    tMin: number, 
    tMax: number, 
    points: number,
    scale: number,
    shouldCenter: boolean = false,
    isPolar: boolean = false
): Complex[] => {
    const path: Complex[] = [];
    
    let fn1: Function, fn2: Function;
    
    try {
        fn1 = new Function('t', `return ${fn1Str};`);
        fn2 = new Function('t', `return ${fn2Str};`);
    } catch (e) {
        console.error("Invalid function string", e);
        return [];
    }

    for (let i = 0; i < points; i++) {
        const t = tMin + (tMax - tMin) * (i / points);
        try {
            const val1 = fn1(t);
            const val2 = fn2(t);
            if (isNaN(val1) || isNaN(val2)) continue;
            
            let x, y;

            if (isPolar) {
                x = val1 * Math.cos(val2);
                y = val1 * Math.sin(val2);
            } else {
                x = val1;
                y = val2;
            }
            
            path.push({ re: x * scale, im: -y * scale }); 
        } catch (e) {
            continue;
        }
    }
    
    if (path.length === 0) return [];

    if (shouldCenter) {
        const sum = path.reduce((acc, p) => ({ re: acc.re + p.re, im: acc.im + p.im }), { re: 0, im: 0 });
        const center = { re: sum.re / path.length, im: sum.im / path.length };
        
        for (let i = 0; i < path.length; i++) {
            path[i].re -= center.re;
            path[i].im -= center.im;
        }
    }
    
    const pointObj = path.map(p => ({x: p.re, y: p.im}));
    return resamplePath(pointObj, points);
};
```

### 4.2 `utils/imageProcessing.ts`

```typescript
import { Point } from '../types';

// Moore-Neighbor Tracing algorithm to find the external contour
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

      const MAX_SIZE = 512;
      let w = img.width;
      let h = img.height;
      
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

      if (startX === -1) {
        resolve([]);
        return;
      }

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
      const MAX_ITER = w * h * 2;

      while (iterations < MAX_ITER) {
          let foundNext = false;
          let startSearchIdx = 0;

          for(let i=0; i<8; i++) {
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
      
      if (contour.length < 3) {
          resolve([]);
          return;
      }

      const cx = contour.reduce((sum, p) => sum + p.x, 0) / contour.length;
      const cy = contour.reduce((sum, p) => sum + p.y, 0) / contour.length;
      
      const centeredContour = contour.map(p => ({
          x: (p.x - cx), 
          y: (p.y - cy)
      }));

      resolve(centeredContour);
    };
    
    img.onerror = (e) => {
        console.error("Image load failed", e);
        reject("Failed to load image for tracing.");
    };
    
    img.src = imageSrc;
  });
};
```

### 4.3 `utils/presetShapes.ts`

```typescript
const PIKACHU_PATH = `
  M123,417 c-12,-8 -17,-28 -9,-38 c3,-3 1,-7 -7,-14 c-17,-14 -13,-45 5,-49 c7,-2 9,-5 7,-11 c-3,-8 -2,-11 6,-20 
  c12,-12 11,-15 -3,-28 c-20,-20 -15,-40 10,-43 c9,-1 11,-4 8,-12 c-6,-15 13,-46 32,-52 c9,-3 8,-7 -5,-35 
  c-16,-34 -13,-43 14,-35 c15,4 32,18 38,30 c6,12 15,16 35,14 c28,-2 32,-5 49,-28 c26,-37 66,-50 63,-20 
  c-1,10 -8,27 -15,38 c-10,16 -10,19 1,19 c23,1 55,54 44,72 c-5,9 -4,11 6,11 c24,0 28,15 5,23 c-16,5 -17,7 -5,17 
  c19,16 13,38 -9,38 c-7,0 -13,4 -13,10 c0,5 5,14 11,20 c12,11 12,13 1,22 c-7,6 -13,15 -13,20 c0,22 -38,53 -61,50 
  c-13,-2 -15,0 -13,16 c2,18 -3,23 -27,27 c-15,2 -29,-1 -31,-8 c-2,-6 -10,-11 -17,-11 c-8,0 -20,7 -27,15 
  c-12,14 -46,14 -60,0 c-8,-8 -21,-13 -36,-13 c-31,0 -61,28 -56,52 c3,12 -5,16 -24,10 c-12,-3 -26,-10 -31,-15 
  l-10,-9 l11,-12 Z
`;

const DORAEMON_PATH = `
  M193,467 c-30,-7 -44,-24 -36,-44 c3,-6 1,-16 -5,-23 c-11,-13 -13,-40 -3,-54 c4,-6 3,-15 -3,-24 c-20,-31 6,-71 39,-60 
  c5,2 7,-3 4,-12 c-9,-27 9,-58 37,-65 c11,-3 11,-5 3,-18 c-14,-22 -7,-55 14,-69 c32,-21 82,-15 107,13 c17,19 19,43 5,66 
  c-5,9 -5,11 3,14 c28,9 43,40 33,67 c-3,9 -1,13 6,12 c28,-6 53,24 40,49 c-5,9 -4,15 2,20 c13,10 13,38 0,51 
  c-6,6 -8,15 -4,20 c9,15 -3,38 -21,41 c-10,2 -20,9 -23,16 c-4,13 -18,17 -66,19 c-33,1 -64,-2 -69,-7 c-4,-5 -22,-6 -40,-3 
  c-27,5 -41,1 -53,-12 Z
`;

const PIKACHU_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="white"/>
    <path transform="translate(20, 0)" d="${PIKACHU_PATH}" fill="black"/>
</svg>
`;

const DORAEMON_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="white"/>
    <path transform="translate(0, 0)" d="${DORAEMON_PATH}" fill="black"/>
</svg>
`;

export const PRESET_URIS = {
    PIKACHU: `data:image/svg+xml;base64,${btoa(PIKACHU_SVG)}`,
    DORAEMON: `data:image/svg+xml;base64,${btoa(DORAEMON_SVG)}`
};
```

---

## 5. 服务层

### 5.1 `services/gemini.ts`

```typescript
import { GoogleGenAI } from "@google/genai";

const AI_MODEL = 'gemini-2.5-flash-image';

export const generateCharacterImage = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const enhancedPrompt = `
    Generate an image.
    Create a high-contrast solid black silhouette of ${prompt} on a pure white background.
    Style: Vector art, flat, minimal, no internal details, no shading.
    The shape should be centered and clearly defined.
  `;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        const textPart = response.candidates[0].content.parts.find(p => p.text);
        if (textPart?.text) {
            throw new Error(`Gemini returned text instead of image: ${textPart.text.slice(0, 100)}...`);
        }
    }
    
    throw new Error("No image data returned from Gemini.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
```

---

## 6. 常量数据

### 6.1 `constants/presets.ts`

> 完整代码见项目仓库，包含 12+ 预设图形定义

```typescript
import { PresetDef } from '../types';

export const PRESETS: Record<string, PresetDef> = {
  ALIEN_SIGNAL: {
    label: '数学: 螺旋星系 (生成艺术)',
    renderer: 'PARTICLE',
    tMin: 0,
    tMax: 60, 
    scale: 200, 
    layers: []
  },

  BASIC_CIRCLE: {
    label: '基础: 完美圆形',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 150,
    layers: [
      {
        xFn: 'Math.cos(t)',
        yFn: 'Math.sin(t)',
        colorHex: '#ffffff',
        lineWidth: 3
      }
    ]
  },
  
  BASIC_HEART: {
    label: '基础: 数学之心',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 12,
    layers: [
      {
        xFn: '16 * Math.pow(Math.sin(t), 3)',
        yFn: '13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)',
        colorHex: '#ef4444', 
        fillColor: '#450a0a', 
        lineWidth: 2.5
      }
    ]
  },
  
  // ... 更多预设见完整源码
};
```

---

## 7. Hooks

### 7.1 `hooks/useFourier.ts`

```typescript
import { useState, useEffect, useMemo } from 'react';
import { Complex, MathLayer, ProcessedLayer, FourierCoefficient } from '../types';
import { dft } from '../utils/math';

export const useFourier = (pathsData: Complex[][], layerConfigs: MathLayer[]) => {
    const dftResults = useMemo(() => {
        if (pathsData.length === 0) return [];
        return pathsData.map(path => dft(path));
    }, [pathsData]);

    const processedLayers = useMemo(() => {
        if (dftResults.length === 0 || layerConfigs.length === 0) {
            return [];
        }

        return dftResults.map((coeffs, index) => {
            const config = layerConfigs[index] || layerConfigs[0];
            
            let modFn = (t: number) => 1;
            if (config.ampModFn) {
                try {
                    modFn = new Function('t', `return ${config.ampModFn};`) as (t: number) => number;
                } catch (e) {
                    // Invalid function, use default
                }
            }
            
            return {
                id: `layer-${index}`,
                coefficients: coeffs,
                color: config.colorHex,
                fillColor: config.fillColor,
                opacity: config.opacity ?? 1.0,
                lineWidth: config.lineWidth ?? 2.0,
                modFn
            };
        });
    }, [dftResults, layerConfigs]);

    return processedLayers;
};
```

### 7.2 `hooks/usePathGenerator.ts`

> 完整代码见 [TECHNICAL_DOC.md](./TECHNICAL_DOC.md) 第4.5节

---

## 8. 组件

### 8.1 `components/ControlPanel.tsx`

> 完整代码 (286行) - 控制面板组件，包含数学函数编辑器、图片导入、AI生成三个标签页

### 8.2 `components/EpicycleVisualizer.tsx`

> 完整代码 (477行) - Canvas 傅里叶可视化器，包含旋转矢量动画和轨迹绘制

### 8.3 `components/GenerativeVisualizer.tsx`

> 完整代码 (183行) - 粒子系统可视化器

---

## 9. 主应用

### 9.1 `App.tsx`

> 完整代码 (295行) - 主应用组件，整合所有子组件和 Hooks

---

## 快速复刻命令

```bash
# 1. 创建项目目录
mkdir fourier-architect && cd fourier-architect

# 2. 初始化包管理
pnpm init

# 3. 安装依赖
pnpm add react@^19.2.3 react-dom@^19.2.3 @google/genai@^1.33.0 lucide-react@^0.561.0
pnpm add -D vite@^6.2.0 @vitejs/plugin-react@^5.0.0 typescript@~5.8.2 @types/node@^22.14.0

# 4. 创建目录结构
mkdir -p components hooks utils services constants

# 5. 复制所有源文件 (从本附录)

# 6. 配置环境变量
echo "GEMINI_API_KEY=your_key_here" > .env

# 7. 启动开发服务器
pnpm dev
```

---

*附录生成时间: 2026-01-25*
