import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, APIKeys } from '@/types';

interface SettingsStore extends AppSettings {
  setApiKey: (key: keyof APIKeys, value: string) => void;
  setGeminiModel: (model: 'flash' | 'flash-lite' | 'pro') => void;
  setOpenrouterModel: (model: string) => void;
  resetSettings: () => void;
  isConfigured: () => boolean;
}

const defaultSettings: AppSettings = {
  apiKeys: {
    gemini: '',
    googleMaps: '',
    storebot: '',
    openrouter: '',
  },
  geminiModel: 'flash',
  openrouterModel: '',
  language: 'it',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setApiKey: (key, value) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [key]: value,
          },
        })),

      setGeminiModel: (model) => set({ geminiModel: model }),

      setOpenrouterModel: (model) => set({ openrouterModel: model }),

      resetSettings: () => set(defaultSettings),

      isConfigured: () => {
        const { apiKeys } = get();
        return Boolean(apiKeys.gemini && apiKeys.googleMaps);
      },
    }),
    {
      name: 'storebot-settings',
    }
  )
);
