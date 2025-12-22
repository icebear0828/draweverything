# 🏗️ Technical Architecture

Fourier Architect follows a linear pipeline to transform abstract data into visual epicycles.

## 1. Data Input & Path Generation
The system supports three primary input streams:
- **Mathematical Functions**: Standard JavaScript `Math` functions evaluated over a range `[tMin, tMax]`.
- **Image Contours**: Uses a **Moore-Neighbor Tracing** algorithm to find the external boundary of foreground objects in a processed image.
- **AI Synthesis**: Leverages Gemini to create minimalist silhouettes which are then fed into the image contour tracer.

## 2. Path Resampling (`utils/math.ts`)
For the Fourier Transform to produce clean results, points must be uniformly distributed along the path. The `resamplePath` utility:
1. Calculates the total linear distance of the input path.
2. Interpolates new points at equal intervals along the segments.
3. Ensures the path is a closed loop for consistent DFT coefficients.

## 3. Discrete Fourier Transform (DFT)
The core engine implements the DFT formula:
$$X_k = \sum_{n=0}^{N-1} x_n \cdot e^{-i 2\pi k n / N}$$
Each coefficient $X_k$ provides:
- **Frequency**: The speed and direction of rotation.
- **Amplitude**: The radius of the epicycle.
- **Phase**: The starting angle offset.

## 4. Rendering Engine (`EpicycleVisualizer.tsx`)
The visualizer runs a high-frequency `requestAnimationFrame` loop:
- **State Management**: Tracks a running `time` variable modulated by the global `speed`.
- **Epicycle Chain**: Iterates through sorted coefficients, drawing vectors (arrows) and circles.
- **Modulation**: If a layer has an `ampModFn`, it dynamically scales the amplitude of the primary epicycle at runtime without re-computing the entire DFT.
- **Path History**: Maintains a buffer of recent coordinates to draw the resulting trailing line.
