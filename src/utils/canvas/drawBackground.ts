/**
 * Draw Background Utility
 * Canvas 背景绘制函数（网格和坐标轴）
 */

interface DrawBackgroundOptions {
  /** 网格线透明度 (0-1)，默认 0.03 */
  gridOpacity?: number;
  /** 坐标轴透明度 (0-1)，默认 0.08 */
  axisOpacity?: number;
  /** 是否显示网格，默认 true */
  showGrid?: boolean;
  /** 是否显示坐标轴，默认 true */
  showAxes?: boolean;
}

export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  currentPan: { x: number; y: number },
  currentZoom: number,
  options: DrawBackgroundOptions = {}
): void => {
  const {
    gridOpacity = 0.03,
    axisOpacity = 0.08,
    showGrid = false,
    showAxes = false,
  } = options;

  // Background color is handled by CSS, we just clear
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const originX = cx + currentPan.x;
  const originY = cy + currentPan.y;

  // Calculate visible range in Logic Coordinates
  const startX = -originX / currentZoom;
  const endX = (w - originX) / currentZoom;
  const startY = -originY / currentZoom;
  const endY = (h - originY) / currentZoom;

  // Dynamic Grid
  if (showGrid && gridOpacity > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${gridOpacity})`;
    ctx.lineWidth = 1 / currentZoom;
    if (ctx.lineWidth < 0.5) ctx.lineWidth = 0.5;

    ctx.beginPath();

    const baseStep = 100;
    const step = baseStep;

    const gridStartCol = Math.floor(startX / step);
    const gridEndCol = Math.ceil(endX / step);

    for (let i = gridStartCol; i <= gridEndCol; i++) {
      const x = i * step;
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }

    const gridStartRow = Math.floor(startY / step);
    const gridEndRow = Math.ceil(endY / step);

    for (let i = gridStartRow; i <= gridEndRow; i++) {
      const y = i * step;
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  // Axes
  if (showAxes && axisOpacity > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${axisOpacity})`;
    ctx.lineWidth = 2 / currentZoom;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, 0); // X Axis
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY); // Y Axis
    ctx.stroke();
  }
};
