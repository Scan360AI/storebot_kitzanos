// API Keys
export interface ApiKeys {
  gmaps: string | null;
  gemini: string | null;
  botId: string | null;
  openrouter: string | null;
  openrouterModel: string | null;
}

export interface ApiKeyStatus {
  key: string | null;
  valid: boolean;
  loading: boolean;
  error?: string;
}

// Property Data
export interface PropertyData {
  indirizzo?: string;
  citta?: string;
  provincia?: string;
  cap?: string;
  superficie_mq?: number;
  piano?: string;
  vetrine?: number;
  canna_fumaria?: boolean;
  altezza_soffitto?: number;
  aria_condizionata?: boolean;
  riscaldamento?: string;
  servizi_igienici?: number;
  posti_auto?: number;
  magazzino_mq?: number;
  affaccio?: string;
  stato_immobile?: string;
  anno_costruzione?: number;
  classe_energetica?: string;
  prezzo_richiesta?: number;
  prezzo_mq?: number;
  spese_condominiali?: number;
  note?: string;
  [key: string]: string | number | boolean | undefined;
}

// Brand Classification
export interface BrandClassification {
  type: 'brand' | 'local';
  assignedMacroCategoryKey: string;
  brandKeyFromConfig: string | null;
  brandDisplayName: string | null;
  brandConfigCategory: string | null;
  brandConfigSubCategory: string | null;
  matchMethod: string | null;
  similarityScore: number | null;
  isUserConfirmed: boolean;
}

export interface BrandInfo {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
}

// Context Analysis
export interface POI {
  name: string;
  originalName?: string;
  types: string[];
  category: string;
  distance: number;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  googlePlaceId?: string;
  classification?: BrandClassification;
  // Legacy compatibility
  isBrand?: boolean;
  brandInfo?: BrandInfo;
}

export interface ContextAnalysis {
  address: string;
  coordinates: { lat: number; lng: number };
  pois: POI[];
  analysis?: string;
  timestamp: Date;
}

// Marketing
export interface MarketingData {
  propertyDetails: string;
  neighborhoodContext: string;
  images: string[];
  generatedDescription?: string;
}

// Brand Matching
export interface BrandMatch {
  brand: BrandInfo;
  score: number;
  reasons: string[];
}

// Formaps
export interface FormapsChapter {
  id: string;
  title: string;
  content: string;
  screenshot?: string;
  analysis?: string;
}

// Report
export interface FullReport {
  id?: string;
  address: string;
  createdAt: Date;
  propertyData?: PropertyData;
  contextAnalysis?: ContextAnalysis;
  marketingDescription?: string;
  brandMatches?: BrandMatch[];
  formapsChapters?: FormapsChapter[];
  aiSummary?: string;
}

// OpenRouter Models
export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricePerToken: string;
}

export const OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Veloce ed economico (Dicembre 2025)', pricePerToken: '~$0.00015/1K' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Bilanciato', pricePerToken: '~$0.00025/1K' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Premium', pricePerToken: '~$0.003/1K' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Premium', pricePerToken: '~$0.005/1K' },
  { id: 'meta-llama/llama-3.2-3b-instruct', name: 'Llama 3.2', description: 'Economico', pricePerToken: '~$0.00006/1K' },
];

// Toast/Notification
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
