/**
 * Color Utilities
 * 颜色验证和转换工具函数
 */

/**
 * Validate a hex color string
 * Accepts: #RGB, #RRGGBB, #RGBA, #RRGGBBAA
 */
export const isValidHexColor = (color: string): boolean => {
  if (!color || typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
};

/**
 * Validate any CSS color string
 * Uses canvas to test if the color is valid
 */
export const isValidCSSColor = (color: string): boolean => {
  if (!color || typeof color !== 'string') return false;

  // Quick check for common formats
  if (isValidHexColor(color)) return true;
  if (/^(rgb|hsl)a?\s*\(/.test(color)) return true;
  if (/^(transparent|currentColor)$/i.test(color)) return true;

  // Named colors - check via canvas (browser only)
  if (typeof document !== 'undefined') {
    try {
      const ctx = document.createElement('canvas').getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = color;
        // If the color is invalid, fillStyle won't change or will be transparent
        return ctx.fillStyle !== '#000000' || color.toLowerCase() === 'black';
      }
    } catch {
      return false;
    }
  }

  // Fallback: assume it's valid if we can't test
  return true;
};

/**
 * Sanitize a color value - return fallback if invalid
 */
export const sanitizeColor = (color: string | undefined, fallback: string = '#ffffff'): string => {
  if (!color) return fallback;

  // Already a valid hex color
  if (isValidHexColor(color)) return color;

  // Try to validate as CSS color
  if (isValidCSSColor(color)) return color;

  // Invalid - return fallback
  console.warn(`Invalid color value: "${color}", using fallback: ${fallback}`);
  return fallback;
};

/**
 * Parse a hex color to RGB components
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!isValidHexColor(hex)) return null;

  // Remove # prefix
  let h = hex.slice(1);

  // Expand shorthand (#RGB -> #RRGGBB)
  if (h.length === 3 || h.length === 4) {
    h = h.split('').map(c => c + c).join('');
  }

  const num = parseInt(h.slice(0, 6), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

/**
 * Convert RGB to hex color
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('')}`;
};
