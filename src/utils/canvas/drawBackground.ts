/**
 * Draw Background Utility
 * Canvas 背景绘制函数（网格和坐标轴）
 */

export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  currentPan: { x: number; y: number },
  currentZoom: number
): void => {
  // Background color is handled by CSS, we just clear
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const originX = cx + currentPan.x;
  const originY = cy + currentPan.y;

  // Dynamic Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1 / currentZoom;
  if (ctx.lineWidth < 0.5) ctx.lineWidth = 0.5;

  ctx.beginPath();

  const baseStep = 100;
  const step = baseStep;

  // Calculate visible range in Logic Coordinates
  const startX = -originX / currentZoom;
  const endX = (w - originX) / currentZoom;
  const startY = -originY / currentZoom;
  const endY = (h - originY) / currentZoom;

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

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2 / currentZoom;
  ctx.beginPath();
  ctx.moveTo(startX, 0);
  ctx.lineTo(endX, 0); // X Axis
  ctx.moveTo(0, startY);
  ctx.lineTo(0, endY); // Y Axis
  ctx.stroke();
};
