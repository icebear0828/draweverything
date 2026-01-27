/**
 * Simulation Store - 管理仿真状态
 *
 * 职责：
 * - 播放/暂停控制
 * - 速度控制
 * - 采样点数
 */

import { create } from 'zustand';
import type { SimulationStore } from '../types';

export const useSimulationStore = create<SimulationStore>((set) => ({
  // State
  isRunning: true,
  speed: 1,
  pointCount: 2048,

  // Actions
  setRunning: (running) => set({ isRunning: running }),
  setSpeed: (speed) => set({ speed }),

  pause: () => set({ isRunning: false }),
  resume: () => set({ isRunning: true }),
}));
