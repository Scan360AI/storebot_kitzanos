import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Analysis, ContextAnalysis, PropertyData, BrandMatch } from '@/types';

interface AnalysisStore {
  currentAnalysis: Analysis | null;
  analyses: Analysis[];

  // Current analysis actions
  createNewAnalysis: (address: string) => void;
  setContext: (context: ContextAnalysis) => void;
  setProperty: (property: PropertyData) => void;
  setBrandMatching: (matches: BrandMatch[]) => void;
  setMarketingDescription: (description: string) => void;
  updateAnalysis: (updates: Partial<Analysis>) => void;
  completeAnalysis: () => void;

  // Analysis list actions
  loadAnalysis: (id: string) => void;
  deleteAnalysis: (id: string) => void;
  resetCurrent: () => void;
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      currentAnalysis: null,
      analyses: [],

      createNewAnalysis: (address: string) => {
        const newAnalysis: Analysis = {
          id: `analysis_${Date.now()}`,
          name: `Analisi ${address}`,
          address,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        };
        set({
          currentAnalysis: newAnalysis,
          analyses: [newAnalysis, ...get().analyses],
        });
      },

      setContext: (context: ContextAnalysis) =>
        set((state) => ({
          currentAnalysis: state.currentAnalysis
            ? {
                ...state.currentAnalysis,
                context,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      setProperty: (property: PropertyData) =>
        set((state) => ({
          currentAnalysis: state.currentAnalysis
            ? {
                ...state.currentAnalysis,
                property,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      setBrandMatching: (matches: BrandMatch[]) =>
        set((state) => ({
          currentAnalysis: state.currentAnalysis
            ? {
                ...state.currentAnalysis,
                brandMatching: matches,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      setMarketingDescription: (description: string) =>
        set((state) => ({
          currentAnalysis: state.currentAnalysis
            ? {
                ...state.currentAnalysis,
                marketingDescription: description,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      updateAnalysis: (updates: Partial<Analysis>) =>
        set((state) => ({
          currentAnalysis: state.currentAnalysis
            ? {
                ...state.currentAnalysis,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      completeAnalysis: () =>
        set((state) => ({
          currentAnalysis: state.currentAnalysis
            ? {
                ...state.currentAnalysis,
                status: 'completed',
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      loadAnalysis: (id: string) => {
        const analysis = get().analyses.find((a) => a.id === id);
        if (analysis) {
          set({ currentAnalysis: analysis });
        }
      },

      deleteAnalysis: (id: string) =>
        set((state) => ({
          analyses: state.analyses.filter((a) => a.id !== id),
          currentAnalysis: state.currentAnalysis?.id === id ? null : state.currentAnalysis,
        })),

      resetCurrent: () => set({ currentAnalysis: null }),
    }),
    {
      name: 'storebot-analyses',
    }
  )
);
