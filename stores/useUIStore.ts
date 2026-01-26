/**
 * UI Store - 管理 UI 状态
 *
 * 职责：
 * - 面板开关状态
 * - 活动标签页
 */

import { create } from 'zustand';
import { UIStore } from './types';

export const useUIStore = create<UIStore>((set) => ({
  // State
  isInspectorOpen: false,
  isPresetMenuOpen: false,
  activeTab: 'MATH',

  // Actions
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  setPresetMenuOpen: (open) => set({ isPresetMenuOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  togglePresetMenu: () => set((state) => ({ isPresetMenuOpen: !state.isPresetMenuOpen })),

  closeAllPanels: () => set({
    isInspectorOpen: false,
    isPresetMenuOpen: false,
  }),
}));
