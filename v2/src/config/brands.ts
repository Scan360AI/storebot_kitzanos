// TypeScript wrapper for brands-config-original.js
// The configuration is loaded globally via script tag in index.html

export interface CategoryConfig {
  types: string[];
  icon: string;
  color: string;
}

export interface BrandConfig {
  displayName: string;
  category: string;
  subCategory: string;
  aliases?: string[];
}

export interface CategoriesConfig {
  [categoryName: string]: CategoryConfig;
}

export interface BrandsConfig {
  [brandKey: string]: BrandConfig;
}

// Extend window interface to include our global configuration
declare global {
  interface Window {
    APP_CATEGORIES_CONFIG?: CategoriesConfig;
    ALL_BRANDS_CONFIG?: BrandsConfig;
  }
}

// Load configurations from global window object
export const CATEGORIES_CONFIG: CategoriesConfig =
  (typeof window !== 'undefined' && window.APP_CATEGORIES_CONFIG) || {};

export const BRANDS_CONFIG: BrandsConfig =
  (typeof window !== 'undefined' && window.ALL_BRANDS_CONFIG) || {};

// Helper function to normalize strings for brand matching (matching original logic)
export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Get category names
export const getCategoryNames = (): string[] => {
  return Object.keys(CATEGORIES_CONFIG);
};

// Get category config by name
export const getCategoryConfig = (categoryName: string): CategoryConfig | undefined => {
  return CATEGORIES_CONFIG[categoryName];
};

// Get all brands for a specific category
export const getBrandsByCategory = (categoryName: string): BrandConfig[] => {
  return Object.values(BRANDS_CONFIG).filter(
    brand => brand.category === categoryName
  );
};

// Get brand count by category
export const getBrandCountByCategory = (categoryName: string): number => {
  return getBrandsByCategory(categoryName).length;
};
