
import { PresetDef, CategoryMeta } from '../types';

/**
 * 预设分类元数据
 */
export const PRESET_CATEGORIES: CategoryMeta[] = [
  { id: 'particle', label: '粒子效果', icon: '✦', description: '基于公式的动态粒子系统' },
  { id: 'fourier', label: 'FFT 绘图', icon: '○', description: '傅里叶变换圆周运动' },
  { id: 'hybrid', label: '混合效果', icon: '⚡', description: '粒子 + FFT 叠加' },
];

export const PRESETS: Record<string, PresetDef> = {
  // --- PARTICLE PRESETS ---
  ALIEN_SIGNAL: {
    label: '螺旋星系',
    category: 'particle',
    thumbnail: '🌀',
    renderer: 'PARTICLE',
    tMin: 0,
    tMax: 60,
    scale: 200,
    layers: [],
    particle: {
      // 极坐标公式 (1.md 参考实现):
      // r_base = n^(3/2) / (n + 1000)
      // wave = sin(0.1 * n * sin(83.333 * t))
      // r_final = r_base * (1 + 0.3 * wave)  // 呼吸调制 [0.7, 1.3]
      // theta = 0.1 * n * t (方位角)
      radiusFn: 'Math.pow(n, 1.5) / (n + 1000)',
      thetaFn: '0.1 * n * t',  // 方位角
      // 波形调制: (1 + 0.3 * wave)，范围 [0.7, 1.3]，半径始终为正
      radiusModFn: '1 + 0.3 * Math.sin(0.1 * n * Math.sin((250/3) * t))',
      alphaFn: '0.3 + 0.7 * Math.abs(Math.sin(0.1 * n * Math.sin((250/3) * t)))',
      particleCount: 4000,
      colorHex: '#ffffff',
      timeScale: 0.0002
    }
  },

  COSMIC_VORTEX: {
    label: '宇宙漩涡',
    category: 'particle',
    thumbnail: '🌊',
    renderer: 'PARTICLE',
    tMin: 0,
    tMax: 60,
    scale: 200,
    layers: [],
    particle: {
      radiusFn: 'n * 0.02',
      thetaFn: 'n * 0.1 + t * 2',
      radiusModFn: '1 + 0.5 * Math.sin(t * 5)',
      alphaFn: '0.8',
      particleCount: 3000,
      colorHex: '#22d3ee',
      timeScale: 0.001
    }
  },

  QUANTUM_FIELD: {
    label: '量子噪声场',
    category: 'particle',
    thumbnail: '⚛️',
    renderer: 'PARTICLE',
    tMin: 0,
    tMax: 60,
    scale: 200,
    layers: [],
    particle: {
      // r: 粒子分布在圆环带上，加上噪声抖动
      radiusFn: '80 + 40 * Math.sin(n) + 20 * Math.sin(t * 10 + n)',

      // theta: 均匀分布 + 旋转 (0.001047 ≈ 2π/6000，湍流效果由 radius 提供)
      thetaFn: 't + n * 0.001047',

      // 调制: 快速闪烁模拟能量涨落
      radiusModFn: '1 + 0.2 * Math.sin(t * 20 + n)',

      // 透明度: 粒子像火花一样生灭
      alphaFn: '0.4 + 0.6 * Math.sin(t * 5 + n * 13.9)',
      particleCount: 6000,  // 需要 6000 才能让 theta (n*0.001) 覆盖完整 2π
      colorHex: '#10b981', // Emerald
      timeScale: 0.002
    }
  },

  // --- FOURIER PRESETS ---
  QUANTUM_CHRONOMETER: {
    label: '量子天文钟',
    category: 'fourier',
    thumbnail: '⏰',
    tMin: 0,
    tMax: 12 * Math.PI,
    scale: 15,
    layers: [
      // 1. The Temporal Weaver
      {
        xFn: '19 * Math.cos(t) - 7 * Math.cos(8/3 * t)',
        yFn: '19 * Math.sin(t) - 7 * Math.sin(8/3 * t)',
        colorHex: '#8b5cf6', // Violet-500
        fillColor: '#2e1065', // Violet-950
        lineWidth: 1.5,
        opacity: 0.9
      },
      // 2. The Event Horizon
      {
        xFn: '13 * Math.cos(t) + 3 * Math.cos(6*t)',
        yFn: '13 * Math.sin(t) + 3 * Math.sin(6*t)',
        colorHex: '#06b6d4', // Cyan-500
        lineWidth: 2,
        opacity: 0.8
      },
      // 3. The Singularity
      {
        xFn: '6 * Math.sin(3*t) + Math.cos(14*t)',
        yFn: '6 * Math.cos(4*t) + Math.sin(14*t)',
        colorHex: '#f43f5e', // Rose-500
        fillColor: '#881337', // Rose-900
        lineWidth: 2.5,
        opacity: 1,
        ampModFn: '1 + 0.15 * Math.sin(3*t)'
      },
      // 4. Probability Clouds
      {
        xFn: '(24 + 4*Math.sin(5*t)) * Math.cos(t + Math.sin(t))',
        yFn: '(24 + 4*Math.sin(5*t)) * Math.sin(t + Math.sin(t))',
        colorHex: '#10b981', // Emerald-500
        lineWidth: 1,
        opacity: 0.4
      }
    ]
  },

  ROYAL_MANDALA: {
    label: '皇家曼陀罗',
    category: 'fourier',
    thumbnail: '🔮',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 18,
    layers: [
      {
        xFn: '22 * Math.cos(t) + 8 * Math.cos(2*t)',
        yFn: '22 * Math.sin(t) - 8 * Math.sin(2*t)',
        colorHex: '#3b82f6',
        fillColor: '#172554',
        lineWidth: 2,
        opacity: 0.8
      },
      {
        xFn: '16 * Math.cos(t) - 4 * Math.cos(6*t)',
        yFn: '16 * Math.sin(t) - 4 * Math.sin(6*t)',
        colorHex: '#f59e0b',
        fillColor: '#451a03',
        lineWidth: 2.5,
        opacity: 1
      },
      {
        xFn: '10 * Math.cos(3*t) * Math.cos(t)',
        yFn: '10 * Math.cos(3*t) * Math.sin(t)',
        colorHex: '#22d3ee',
        fillColor: '#083344',
        lineWidth: 2,
        opacity: 0.9
      },
      {
        xFn: '4 * Math.sin(5*t)',
        yFn: '4 * Math.cos(4*t)',
        colorHex: '#f472b6',
        lineWidth: 3,
        opacity: 1
      }
    ]
  },

  COSMIC_GEARS: {
    label: '宇宙齿轮',
    category: 'fourier',
    thumbnail: '⚙️',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 12,
    layers: [
      {
        xFn: '(22 + 2 * Math.cos(16*t)) * Math.cos(t)',
        yFn: '(22 + 2 * Math.cos(16*t)) * Math.sin(t)',
        colorHex: '#94a3b8',
        lineWidth: 2
      },
      {
        xFn: '(8 + 1.5 * Math.cos(8*t)) * Math.cos(t)',
        yFn: '(8 + 1.5 * Math.cos(8*t)) * Math.sin(t)',
        colorHex: '#fcd34d',
        fillColor: '#78350f',
        lineWidth: 2
      },
      {
        xFn: '15 * Math.cos(t) + 4 * Math.cos(5*t)',
        yFn: '15 * Math.sin(t) + 4 * Math.sin(5*t)',
        colorHex: '#60a5fa',
        lineWidth: 2
      },
      {
        xFn: '15 * Math.cos(t + Math.PI) + 4 * Math.cos(5*t)',
        yFn: '15 * Math.sin(t + Math.PI) + 4 * Math.sin(5*t)',
        colorHex: '#f472b6',
        lineWidth: 2
      }
    ]
  },

  BASIC_CIRCLE: {
    label: '完美圆形',
    category: 'fourier',
    thumbnail: '⭕',
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
    label: '数学之心',
    category: 'fourier',
    thumbnail: '❤️',
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

  BASIC_INFINITY: {
    label: '无限符号',
    category: 'fourier',
    thumbnail: '♾️',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 100,
    layers: [
      {
        xFn: '2 * Math.cos(t)',
        yFn: 'Math.sin(2*t)',
        colorHex: '#8b5cf6',
        lineWidth: 3
      }
    ]
  },

  BASIC_STAR: {
    label: '极地之星',
    category: 'fourier',
    thumbnail: '⭐',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 15,
    layers: [
      {
        xFn: '(10 + 4 * Math.cos(5*t)) * Math.cos(t)',
        yFn: '(10 + 4 * Math.cos(5*t)) * Math.sin(t)',
        colorHex: '#fbbf24',
        fillColor: '#451a03',
        lineWidth: 2
      }
    ]
  },

  BASIC_BLOB: {
    label: '有机体',
    category: 'fourier',
    thumbnail: '🫧',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 15,
    layers: [
      {
        xFn: '(10 + 2*Math.sin(3*t) + 1.5*Math.cos(5*t)) * Math.cos(t)',
        yFn: '(10 + 2*Math.sin(3*t) + 1.5*Math.cos(5*t)) * Math.sin(t)',
        colorHex: '#10b981',
        fillColor: '#022c22',
        lineWidth: 2
      }
    ]
  },

  NEON_HOMESTEAD: {
    label: '赛博小屋',
    category: 'fourier',
    thumbnail: '🏠',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 18,
    layers: [
      { xFn: '15 + 8 * Math.cos(t)', yFn: '-10 + 8 * Math.sin(t)', colorHex: '#d97706', fillColor: '#78350f', lineWidth: 0, opacity: 0.6 },
      { xFn: '15 + 9.5 * Math.cos(t)', yFn: '-10 + 2 * Math.sin(t) * Math.sin(5*t)', colorHex: '#fbbf24', lineWidth: 1.5, opacity: 0.8 },
      { xFn: '15 * (t - Math.PI)', yFn: '2 + -1 * Math.abs(Math.sin(3*t)) * Math.exp(-0.1*(t-Math.PI)*(t-Math.PI)) * 8', colorHex: '#6366f1', fillColor: '#1e1b4b', lineWidth: 2, opacity: 0.8 },
      { xFn: '25 * Math.cos(t)', yFn: '12 + 2 * Math.sin(5*t) * Math.cos(t)', colorHex: '#0ea5e9', opacity: 0.4, lineWidth: 1 },
      { xFn: '-5 + 7 * Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 0.3)', yFn: '5 + 6 * Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 0.3)', colorHex: '#db2777', fillColor: '#831843', lineWidth: 2, opacity: 1.0 },
      { xFn: '-5 + 8 * Math.cos(t) * Math.cos(0.5*t)', yFn: '-1 + 5 * Math.sin(t) * Math.abs(Math.cos(0.5*t)) - 3', colorHex: '#db2777', lineWidth: 2, opacity: 1.0 },
      { xFn: '-5 + 1.5 * Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 0.1)', yFn: '8 + 3 * Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 0.1)', colorHex: '#fcd34d', fillColor: '#fef3c7', lineWidth: 2, opacity: 0.9 },
      { xFn: '-15 + 0.5 * Math.cos(t)', yFn: '5 + 4 * Math.sin(t)', colorHex: '#d97706', fillColor: '#451a03', lineWidth: 2, opacity: 1.0 },
      { xFn: '-15 + (4 + Math.sin(10*t)) * Math.cos(t)', yFn: '0 + (4 + Math.sin(10*t)) * Math.sin(t)', colorHex: '#10b981', fillColor: '#064e3b', lineWidth: 1.5, opacity: 0.9 },
      { xFn: '12 * Math.sin(t) * Math.cos(4*t)', yFn: '-4 + 10 * Math.sin(t) * Math.sin(3*t)', colorHex: '#ffffff', lineWidth: 1, opacity: 0.6 }
    ]
  },

  HYPERCUBE_PROJECTION: {
    label: '四维超立方体',
    category: 'fourier',
    thumbnail: '🧊',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 40,
    layers: [
      {
        xFn: '6 * Math.cos(t) + 2 * Math.cos(5*t)',
        yFn: '6 * Math.sin(t) - 2 * Math.sin(5*t)',
        colorHex: '#facc15',
        lineWidth: 3,
        opacity: 1
      },
      {
        xFn: '3 * Math.cos(t) + 5 * Math.cos(3*t)',
        yFn: '3 * Math.sin(t) - 5 * Math.sin(3*t)',
        colorHex: '#f43f5e',
        lineWidth: 2,
        opacity: 0.8
      }
    ]
  },

  EPICYCLE_CHAOS: {
    label: '三体混沌',
    category: 'fourier',
    thumbnail: '🌐',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 40,
    layers: [
      {
        xFn: '5 * Math.cos(t) + 3 * Math.cos(Math.sqrt(2)*t) + 2 * Math.cos(Math.PI*t)',
        yFn: '5 * Math.sin(t) + 3 * Math.sin(Math.sqrt(2)*t) + 2 * Math.sin(Math.PI*t)',
        colorHex: '#f472b6',
        lineWidth: 2
      }
    ]
  },

  PHOENIX_ASCENSION: {
    label: '凤凰涅槃',
    category: 'fourier',
    thumbnail: '🔥',
    tMin: 0,
    tMax: 12 * Math.PI,
    scale: 35,
    layers: [
      {
        xFn: '1.2 * Math.sin(t) * (Math.exp(Math.cos(t)) - 2*Math.cos(4*t) - Math.pow(Math.sin(t/12), 5))',
        yFn: '1.2 * Math.cos(t) * (Math.exp(Math.cos(t)) - 2*Math.cos(4*t) - Math.pow(Math.sin(t/12), 5))',
        colorHex: '#ef4444',
        lineWidth: 3
      },
      {
        xFn: '1.4 * Math.sin(t) * (Math.exp(Math.cos(t)) - 2*Math.cos(4*t) - Math.pow(Math.sin(t/12), 5)) + 2',
        yFn: '1.4 * Math.cos(t) * (Math.exp(Math.cos(t)) - 2*Math.cos(4*t) - Math.pow(Math.sin(t/12), 5)) + 2',
        colorHex: '#f97316',
        opacity: 0.7,
        lineWidth: 2
      }
    ]
  },

  // --- HYBRID PRESETS (粒子 + FFT 叠加) ---
  COSMIC_HEART: {
    label: '星际之心',
    category: 'hybrid',
    thumbnail: '💫',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 12,
    // FFT 层: 心形
    layers: [
      {
        xFn: '16 * Math.pow(Math.sin(t), 3)',
        yFn: '13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)',
        colorHex: '#f43f5e',
        fillColor: '#881337',
        lineWidth: 2.5
      }
    ],
    // 粒子层: 星尘背景
    particle: {
      radiusFn: 'Math.pow(n, 1.5) / (n + 800)',
      thetaFn: '0.08 * n * t',
      radiusModFn: '1 + 0.2 * Math.sin(0.05 * n * Math.sin(200 * t))',
      alphaFn: '0.2 + 0.5 * Math.abs(Math.sin(0.08 * n * Math.sin(200 * t)))',
      particleCount: 3000,
      colorHex: '#fda4af',
      timeScale: 0.0003
    }
  },

  NEBULA_MANDALA: {
    label: '星云曼陀罗',
    category: 'hybrid',
    thumbnail: '🌌',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 18,
    // FFT 层: 曼陀罗
    layers: [
      {
        xFn: '16 * Math.cos(t) - 4 * Math.cos(6*t)',
        yFn: '16 * Math.sin(t) - 4 * Math.sin(6*t)',
        colorHex: '#8b5cf6',
        fillColor: '#2e1065',
        lineWidth: 2
      },
      {
        xFn: '10 * Math.cos(3*t) * Math.cos(t)',
        yFn: '10 * Math.cos(3*t) * Math.sin(t)',
        colorHex: '#06b6d4',
        lineWidth: 1.5
      }
    ],
    // 粒子层: 星云
    particle: {
      radiusFn: '60 + 30 * Math.sin(n * 0.1)',
      thetaFn: 'n * 0.05 + t',
      radiusModFn: '1 + 0.3 * Math.sin(t * 3 + n * 0.1)',
      alphaFn: '0.15 + 0.3 * Math.sin(t * 2 + n * 0.05)',
      particleCount: 2000,
      colorHex: '#c4b5fd',
      timeScale: 0.0005
    }
  }
};
