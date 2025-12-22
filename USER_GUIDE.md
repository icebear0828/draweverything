# 📖 User Guide

## 📐 Writing Equations
In the **Equation Engine**, you can use standard JavaScript math syntax.
- **Variables**: Use `t` as the primary time parameter.
- **Functions**: Use `Math.sin(t)`, `Math.cos(t)`, `Math.pow(t, 2)`, `Math.exp(t)`, etc.
- **Examples**:
  - *Circle*: `x = Math.cos(t)`, `y = Math.sin(t)`
  - *Heart*: `x = 16 * Math.pow(Math.sin(t), 3)`, `y = 13*Math.cos(t) - 5*Math.cos(2*t)`

## 🌊 Amplitude Modulation
This unique feature allows the "radius" of your drawing to change over time.
- **Input**: `Radius Mod. (Amp)`
- **Effect**: A value of `1` is neutral. `1 + 0.5 * Math.sin(t * 3)` will make the shape "breathe" in and out.

## 🖼️ Image Tracing
To get the best results from image uploads:
1. Use **high-contrast** images (black on white is best).
2. Ensure the object is **connected** (isolated parts may not be traced).
3. The tracer will find the *outermost* boundary.

## ⌨️ Controls
- **Pan**: Click and drag on the background.
- **Zoom**: Use your mouse wheel or trackpad pinch.
- **Playback**: Use the "Resume/Pause" button and "Playback Speed" slider to control the simulation tempo.
- **Layers**: Click a layer in the **Layers Manager** to expand its specific settings.
