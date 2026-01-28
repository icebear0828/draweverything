/**
 * Application Configuration Constants
 * 集中管理应用配置常量，避免魔法数字
 */

// ============================================
// Image Processing
// ============================================

/** 图像处理的最大尺寸 (像素) */
export const IMAGE_MAX_SIZE = 512;

/** 图像二值化阈值 (0-255) */
export const IMAGE_THRESHOLD = 128;

/** 轮廓追踪最大迭代次数倍数 */
export const CONTOUR_MAX_ITER_MULTIPLIER = 2;

/** 最小有效轮廓点数 */
export const MIN_CONTOUR_POINTS = 3;

/** 图片导入最小点数要求 */
export const MIN_IMAGE_POINTS = 20;

// ============================================
// Path & Resampling
// ============================================

/** 路径长度最小阈值 (防止除零) */
export const PATH_LENGTH_EPSILON = 0.0001;

/** 默认采样点数 */
export const DEFAULT_POINT_COUNT = 2048;

// ============================================
// Visualization
// ============================================

/** 轨迹历史最大点数 */
export const PATH_HISTORY_MAX_POINTS = 2000;

/** 显示的最大 Epicycle 数量 */
export const MAX_VISIBLE_EPICYCLES = 50;

/** Epicycle 可见性最小屏幕半径 (像素) */
export const EPICYCLE_MIN_SCREEN_RADIUS = 0.5;

/** 画笔尖端大小基准 (像素) */
export const PEN_TIP_BASE_SIZE = 4;

// ============================================
// Canvas Controls
// ============================================

/** 默认缩放级别 */
export const DEFAULT_ZOOM = 1;

/** 最小缩放级别 */
export const MIN_ZOOM = 0.1;

/** 最大缩放级别 */
export const MAX_ZOOM = 50;

/** 缩放灵敏度 */
export const ZOOM_SENSITIVITY = 0.001;

// ============================================
// Animation
// ============================================

/** 动画时间步长基准 */
export const ANIMATION_TIME_STEP = (2 * Math.PI) / 1000;

// ============================================
// FFT / DFT
// ============================================

/** 使用 FFT 的最小输入大小阈值 */
export const FFT_THRESHOLD = 64;

// ============================================
// API & Network
// ============================================

/** AI API 请求超时 (毫秒) */
export const AI_API_TIMEOUT_MS = 30000;

/** 图像处理 Worker 超时 (毫秒) */
export const IMAGE_PROCESSING_TIMEOUT_MS = 30000;

// ============================================
// Expression Validation
// ============================================

/** 表达式最大长度 */
export const EXPRESSION_MAX_LENGTH = 1000;

// ============================================
// Theme
// ============================================

/** 引擎主题配置 */
export const ENGINE_THEME = {
    /** 主背景色 (深空黑) */
    background: '#050505',
    /** 默认粒子颜色 */
    particleDefault: '#ffffff',
} as const;
