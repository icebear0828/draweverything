/**
 * useAppHandlers Hook
 * 轻量级 Hook，委托给 AppCommands Service
 */
import React, { useCallback } from 'react';
import {
  loadPresetCommand,
  compileCommand,
  processImageCommand,
  processAICommand,
  processSampleCommand,
} from '../services/AppCommands';
import type { PresetSampleKey } from '../types';

export interface AppHandlers {
  handleLoadPreset: (key: string) => Promise<void>;
  handleManualCompile: () => void;
  handleImageProcess: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAIProcess: (prompt: string) => Promise<void>;
  handleSampleProcess: (key: PresetSampleKey) => Promise<void>;
}

export const useAppHandlers = (): AppHandlers => {
  const handleLoadPreset = useCallback(async (key: string) => {
    await loadPresetCommand(key);
  }, []);

  const handleManualCompile = useCallback(() => {
    compileCommand();
  }, []);

  const handleImageProcess = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    await processImageCommand(e.target.files[0]);
  }, []);

  const handleAIProcess = useCallback(async (prompt: string) => {
    await processAICommand(prompt);
  }, []);

  const handleSampleProcess = useCallback(async (key: PresetSampleKey) => {
    await processSampleCommand(key);
  }, []);

  return {
    handleLoadPreset,
    handleManualCompile,
    handleImageProcess,
    handleAIProcess,
    handleSampleProcess,
  };
};
