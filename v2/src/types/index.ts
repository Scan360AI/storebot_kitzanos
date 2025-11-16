// Core Types per Storebot Pro V2

export interface APIKeys {
  gemini: string;
  googleMaps: string;
  storebot?: string;
  openrouter?: string;
}

export interface AppSettings {
  apiKeys: APIKeys;
  geminiModel: 'flash' | 'flash-lite' | 'pro';
  openrouterModel?: string;
  language: 'it' | 'en';
}

export interface POI {
  name: string;
  address?: string;
  category: string;
  type: string;
  distance: number;
  rating?: number;
}

export interface ContextAnalysis {
  pois: POI[];
  summary: string;
  brandsPresentCount: number;
  categories: string[];
}

export interface PropertyData {
  address: string;
  surfaceArea: number;
  price?: string;
  rent?: string;
  windows: number;
  ceilingHeight?: string;
  parking?: string;
  floor?: string;
  condition?: string;
  yearBuilt?: string;
  heating?: string;
  cooling?: string;
  description?: string;
  features?: string[];
  images?: PropertyImage[];
}

export interface PropertyImage {
  url: string;
  caption?: string;
  type?: string;
}

export interface BrandMatch {
  brandName: string;
  category: string;
  compatibility: number;
  reasons: string[];
  targetAudience: string;
  estimatedInvestment?: string;
  notes?: string;
}

export interface Analysis {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  context?: ContextAnalysis;
  property?: PropertyData;
  brandMatching?: BrandMatch[];
  marketingDescription?: string;
  status: 'draft' | 'completed';
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  path: string;
  icon: string;
  completed: boolean;
  optional: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'html' | 'json' | 'excel';
  includeImages: boolean;
  includeBrandDetails: boolean;
  includeMap: boolean;
}
