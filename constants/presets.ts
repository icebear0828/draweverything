

import { PresetDef } from '../types';

export const PRESETS: Record<string, PresetDef> = {
  // --- MASTERPIECES ---
  QUANTUM_CHRONOMETER: {
    label: 'Masterpiece: Quantum Chronometer',
    tMin: 0,
    tMax: 12 * Math.PI,
    scale: 15,
    layers: [
      // 1. The Temporal Weaver (Outer fractional shell)
      // Uses an 8/3 ratio to create a weaving, spirograph-like chaotic boundary
      {
        xFn: '19 * Math.cos(t) - 7 * Math.cos(8/3 * t)',
        yFn: '19 * Math.sin(t) - 7 * Math.sin(8/3 * t)',
        colorHex: '#8b5cf6', // Violet-500
        fillColor: '#2e1065', // Violet-950
        lineWidth: 1.5,
        opacity: 0.9
      },
      // 2. The Event Horizon (Stabilizing ring)
      {
        xFn: '13 * Math.cos(t) + 3 * Math.cos(6*t)',
        yFn: '13 * Math.sin(t) + 3 * Math.sin(6*t)',
        colorHex: '#06b6d4', // Cyan-500
        lineWidth: 2,
        opacity: 0.8
      },
      // 3. The Singularity (Perturbed Lissajous Core)
      {
        xFn: '6 * Math.sin(3*t) + Math.cos(14*t)',
        yFn: '6 * Math.cos(4*t) + Math.sin(14*t)',
        colorHex: '#f43f5e', // Rose-500
        fillColor: '#881337', // Rose-900
        lineWidth: 2.5,
        opacity: 1,
        // Pulse effect
        ampModFn: '1 + 0.15 * Math.sin(3*t)' 
      },
      // 4. Probability Clouds (Orbital traces)
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
    label: 'Art: The Royal Mandala',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 18, 
    layers: [
      // 1. The Midnight Base (Deltoid-inspired)
      { 
        xFn: '22 * Math.cos(t) + 8 * Math.cos(2*t)', 
        yFn: '22 * Math.sin(t) - 8 * Math.sin(2*t)',
        colorHex: '#3b82f6', // Blue-500
        fillColor: '#172554', // Blue-950
        lineWidth: 2,
        opacity: 0.8
      },
      // 2. The Golden Crown (Epicycloid)
      { 
        xFn: '16 * Math.cos(t) - 4 * Math.cos(6*t)',
        yFn: '16 * Math.sin(t) - 4 * Math.sin(6*t)', 
        colorHex: '#f59e0b', // Amber-500 
        fillColor: '#451a03', // Amber-950
        lineWidth: 2.5,
        opacity: 1
      },
      // 3. The Crystal Flower (Rose Curve)
      { 
        xFn: '10 * Math.cos(3*t) * Math.cos(t)',
        yFn: '10 * Math.cos(3*t) * Math.sin(t)',
        colorHex: '#22d3ee', // Cyan-400
        fillColor: '#083344', // Cyan-950
        lineWidth: 2,
        opacity: 0.9
      },
      // 4. The Core (Lissajous Knot)
      { 
        xFn: '4 * Math.sin(5*t)', 
        yFn: '4 * Math.cos(4*t)',
        colorHex: '#f472b6', // Pink-400
        lineWidth: 3,
        opacity: 1
      }
    ]
  },

  COSMIC_GEARS: {
    label: 'Art: Cosmic Gears',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 12,
    layers: [
      // 1. Outer Ring Gear
      {
        xFn: '(22 + 2 * Math.cos(16*t)) * Math.cos(t)',
        yFn: '(22 + 2 * Math.cos(16*t)) * Math.sin(t)',
        colorHex: '#94a3b8',
        lineWidth: 2
      },
      // 2. Inner Sun Gear
      {
        xFn: '(8 + 1.5 * Math.cos(8*t)) * Math.cos(t)',
        yFn: '(8 + 1.5 * Math.cos(8*t)) * Math.sin(t)',
        colorHex: '#fcd34d',
        fillColor: '#78350f',
        lineWidth: 2
      },
      // 3. Planetary Orbit 1
      {
        xFn: '15 * Math.cos(t) + 4 * Math.cos(5*t)',
        yFn: '15 * Math.sin(t) + 4 * Math.sin(5*t)',
        colorHex: '#60a5fa',
        lineWidth: 2
      },
      // 4. Planetary Orbit 2 (Offset)
      {
        xFn: '15 * Math.cos(t + Math.PI) + 4 * Math.cos(5*t)',
        yFn: '15 * Math.sin(t + Math.PI) + 4 * Math.sin(5*t)',
        colorHex: '#f472b6',
        lineWidth: 2
      }
    ]
  },

  // --- BASIC SHAPES ---
  BASIC_CIRCLE: {
    label: 'Basic: The Perfect Circle',
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
    label: 'Basic: Mathematical Heart',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 12,
    layers: [
      {
        xFn: '16 * Math.pow(Math.sin(t), 3)',
        yFn: '13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)',
        colorHex: '#ef4444', // Red-500
        fillColor: '#450a0a', // Red-950
        lineWidth: 2.5
      }
    ]
  },

  BASIC_INFINITY: {
    label: 'Basic: Infinity Loop',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 100,
    layers: [
      {
        xFn: '2 * Math.cos(t)',
        yFn: 'Math.sin(2*t)',
        colorHex: '#8b5cf6', // Violet-500
        lineWidth: 3
      }
    ]
  },

  BASIC_STAR: {
    label: 'Basic: Polar Star',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 15,
    layers: [
      {
        xFn: '(10 + 4 * Math.cos(5*t)) * Math.cos(t)',
        yFn: '(10 + 4 * Math.cos(5*t)) * Math.sin(t)',
        colorHex: '#fbbf24', // Amber-400
        fillColor: '#451a03',
        lineWidth: 2
      }
    ]
  },

  BASIC_BLOB: {
    label: 'Basic: Organic Blob',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 15,
    layers: [
      {
        xFn: '(10 + 2*Math.sin(3*t) + 1.5*Math.cos(5*t)) * Math.cos(t)',
        yFn: '(10 + 2*Math.sin(3*t) + 1.5*Math.cos(5*t)) * Math.sin(t)',
        colorHex: '#10b981', // Emerald-500
        fillColor: '#022c22',
        lineWidth: 2
      }
    ]
  },

  // --- SCENES ---
  NEON_HOMESTEAD: {
    label: 'Scene: Neon Homestead',
    tMin: 0,
    tMax: 2 * Math.PI,
    scale: 18, 
    layers: [
      // 1. The Sun
      { 
        xFn: '15 + 8 * Math.cos(t)',
        yFn: '-10 + 8 * Math.sin(t)',
        colorHex: '#d97706', 
        fillColor: '#78350f',
        lineWidth: 0, 
        opacity: 0.6
      },
      // 2. Sun Halo
      { 
        xFn: '15 + 9.5 * Math.cos(t)',
        yFn: '-10 + 2 * Math.sin(t) * Math.sin(5*t)', 
        colorHex: '#fbbf24', 
        lineWidth: 1.5,
        opacity: 0.8
      },
      // 3. Mountains
      { 
        xFn: '15 * (t - Math.PI)', 
        yFn: '2 + -1 * Math.abs(Math.sin(3*t)) * Math.exp(-0.1*(t-Math.PI)*(t-Math.PI)) * 8',
        colorHex: '#6366f1', 
        fillColor: '#1e1b4b',
        lineWidth: 2,
        opacity: 0.8
      },
      // 4. Ground
      { 
        xFn: '25 * Math.cos(t)', 
        yFn: '12 + 2 * Math.sin(5*t) * Math.cos(t)',
        colorHex: '#0ea5e9', 
        opacity: 0.4,
        lineWidth: 1
      },
      // 5. Cabin Structure
      { 
        xFn: '-5 + 7 * Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 0.3)',
        yFn: '5 + 6 * Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 0.3)',
        colorHex: '#db2777', 
        fillColor: '#831843',
        lineWidth: 2,
        opacity: 1.0
      },
      // 6. Roof
      { 
        xFn: '-5 + 8 * Math.cos(t) * Math.cos(0.5*t)',
        yFn: '-1 + 5 * Math.sin(t) * Math.abs(Math.cos(0.5*t)) - 3', 
        colorHex: '#db2777',
        lineWidth: 2,
        opacity: 1.0
      },
      // 7. Door Light
      { 
        xFn: '-5 + 1.5 * Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 0.1)',
        yFn: '8 + 3 * Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 0.1)',
        colorHex: '#fcd34d', 
        fillColor: '#fef3c7',
        lineWidth: 2,
        opacity: 0.9
      },
      // 8. Tree Trunk
      { 
        xFn: '-15 + 0.5 * Math.cos(t)',
        yFn: '5 + 4 * Math.sin(t)', 
        colorHex: '#d97706',
        fillColor: '#451a03',
        lineWidth: 2,
        opacity: 1.0
      },
      // 9. Tree Leaves
      { 
        xFn: '-15 + (4 + Math.sin(10*t)) * Math.cos(t)',
        yFn: '0 + (4 + Math.sin(10*t)) * Math.sin(t)',
        colorHex: '#10b981', 
        fillColor: '#064e3b',
        lineWidth: 1.5,
        opacity: 0.9
      },
      // 10. Fireflies
      {
        xFn: '12 * Math.sin(t) * Math.cos(4*t)',
        yFn: '-4 + 10 * Math.sin(t) * Math.sin(3*t)',
        colorHex: '#ffffff',
        lineWidth: 1,
        opacity: 0.6
      }
    ]
  },

  // --- COMPLEX MATH ---
  HYPERCUBE_PROJECTION: {
    label: 'Math: Hypercube (4D)',
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
    label: 'Math: 3-Body Chaos',
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

  // --- SINGLES ---
  PHOENIX_ASCENSION: {
    label: 'Art: Phoenix Ascension',
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
  }
};
