import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropertyData, ContextAnalysis, BrandMatch, FormapsChapter, Toast } from '../types';

interface AppState {
  // API Keys
  apiKeys: {
    gmaps: string | null;
    gemini: string | null;
    botId: string | null;
    openrouter: string | null;
    openrouterModel: string | null;
  };

  // Current Address
  currentAddress: string;
  lastAddress: string;

  // Property Data
  propertyData: PropertyData | null;

  // Context Analysis
  contextAnalysis: ContextAnalysis | null;

  // Marketing
  marketingDescription: string | null;

  // Brand Matching
  brandMatches: BrandMatch[];

  // Formaps
  formapsChapters: FormapsChapter[];

  // Loading State
  isLoading: boolean;
  loadingText: string;

  // Toasts
  toasts: Toast[];

  // Actions
  setApiKey: (key: keyof AppState['apiKeys'], value: string | null) => void;
  setCurrentAddress: (address: string) => void;
  setPropertyData: (data: PropertyData | null) => void;
  setContextAnalysis: (analysis: ContextAnalysis | null) => void;
  setMarketingDescription: (description: string | null) => void;
  setBrandMatches: (matches: BrandMatch[]) => void;
  setFormapsChapters: (chapters: FormapsChapter[]) => void;
  addFormapsChapter: (chapter: FormapsChapter) => void;
  updateFormapsChapter: (id: string, updates: Partial<FormapsChapter>) => void;
  removeFormapsChapter: (id: string) => void;
  setLoading: (loading: boolean, text?: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  resetAll: () => void;
}

const API_KEYS_PREFIX = 'storebot_suite_';

// Carica le API keys da localStorage (compatibilità con vecchia app)
const loadApiKeysFromStorage = () => ({
  gmaps: localStorage.getItem(API_KEYS_PREFIX + 'gmaps'),
  gemini: localStorage.getItem(API_KEYS_PREFIX + 'gemini'),
  botId: localStorage.getItem(API_KEYS_PREFIX + 'botId'),
  openrouter: localStorage.getItem(API_KEYS_PREFIX + 'openrouter'),
  openrouterModel: localStorage.getItem(API_KEYS_PREFIX + 'openrouterModel')
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      apiKeys: loadApiKeysFromStorage(),
      currentAddress: localStorage.getItem('storebot_currentAddress') || '',
      lastAddress: localStorage.getItem('storebot_lastAddress') || '',
      propertyData: null,
      contextAnalysis: null,
      marketingDescription: null,
      brandMatches: [],
      formapsChapters: [],
      isLoading: false,
      loadingText: 'Caricamento...',
      toasts: [],

      // Actions
      setApiKey: (key, value) => {
        // Salva anche in localStorage per compatibilità
        if (value) {
          localStorage.setItem(API_KEYS_PREFIX + key, value);
        } else {
          localStorage.removeItem(API_KEYS_PREFIX + key);
        }
        set((state) => ({
          apiKeys: { ...state.apiKeys, [key]: value }
        }));
      },

      setCurrentAddress: (address) => {
        localStorage.setItem('storebot_currentAddress', address);
        localStorage.setItem('storebot_lastAddress', address);
        set({ currentAddress: address, lastAddress: address });
      },

      setPropertyData: (data) => set({ propertyData: data }),

      setContextAnalysis: (analysis) => set({ contextAnalysis: analysis }),

      setMarketingDescription: (description) => set({ marketingDescription: description }),

      setBrandMatches: (matches) => set({ brandMatches: matches }),

      setFormapsChapters: (chapters) => set({ formapsChapters: chapters }),

      addFormapsChapter: (chapter) => set((state) => ({
        formapsChapters: [...state.formapsChapters, chapter]
      })),

      updateFormapsChapter: (id, updates) => set((state) => ({
        formapsChapters: state.formapsChapters.map((ch) =>
          ch.id === id ? { ...ch, ...updates } : ch
        )
      })),

      removeFormapsChapter: (id) => set((state) => ({
        formapsChapters: state.formapsChapters.filter((ch) => ch.id !== id)
      })),

      setLoading: (loading, text = 'Caricamento...') => set({
        isLoading: loading,
        loadingText: text
      }),

      addToast: (toast) => {
        const id = Date.now().toString();
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }));
        // Auto-remove after duration
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration || 3500);
      },

      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      })),

      resetAll: () => {
        // Rimuovi i dati salvati
        localStorage.removeItem('storebot_currentAddress');
        localStorage.removeItem('storebot_lastAddress');
        set({
          currentAddress: '',
          propertyData: null,
          contextAnalysis: null,
          marketingDescription: null,
          brandMatches: [],
          formapsChapters: []
        });
      }
    }),
    {
      name: 'storebot-storage',
      partialize: (state) => ({
        propertyData: state.propertyData,
        contextAnalysis: state.contextAnalysis,
        marketingDescription: state.marketingDescription,
        brandMatches: state.brandMatches,
        formapsChapters: state.formapsChapters
      })
    }
  )
);

export default useAppStore;
