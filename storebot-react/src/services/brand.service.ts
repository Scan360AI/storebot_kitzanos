// Brand Service - Gestione brand matching con Fuse.js e whitelist/blacklist
import Fuse from 'fuse.js';
import { BRANDS_CONFIG, CATEGORIES_CONFIG } from '../data/brands-config';

export interface BrandConfig {
  displayName: string;
  category: string;
  subCategory?: string;
  aliases?: string[];
}

export interface CategoryConfig {
  types: string[];
  icon: string;
  color: string;
}

export interface BrandMatchResult {
  isBrand: boolean;
  brandData?: BrandConfig;
  keyInConfig?: string;
  matchMethod?: string;
  score?: number;
  matchDetails?: string;
}

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

interface FuseBrandSearchItem {
  keyInConfig: string;
  searchTerms: string[];
  brandConfigData: BrandConfig;
}

const STORAGE_KEYS = {
  whitelist: 'storebot_brand_whitelist',
  blacklist: 'storebot_brand_blacklist'
};

class BrandService {
  private fuse: Fuse<FuseBrandSearchItem> | null = null;
  private fuseBrandSearchList: FuseBrandSearchItem[] = [];
  private brandWhitelist: Record<string, string[]> = {};
  private brandBlacklist: Record<string, string[]> = {};

  constructor() {
    this.loadLists();
    this.prepareFuseSearchList();
  }

  private loadLists(): void {
    try {
      const whitelist = localStorage.getItem(STORAGE_KEYS.whitelist);
      const blacklist = localStorage.getItem(STORAGE_KEYS.blacklist);

      if (whitelist) this.brandWhitelist = JSON.parse(whitelist);
      if (blacklist) this.brandBlacklist = JSON.parse(blacklist);
    } catch (error) {
      console.warn('Errore caricamento whitelist/blacklist:', error);
    }
  }

  private saveLists(): void {
    localStorage.setItem(STORAGE_KEYS.whitelist, JSON.stringify(this.brandWhitelist));
    localStorage.setItem(STORAGE_KEYS.blacklist, JSON.stringify(this.brandBlacklist));
  }

  // Normalizza stringa per confronto
  normalizeString(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, '')
      .replace(/\s\s+/g, ' ')
      .trim();
  }

  // Prepara la lista per Fuse.js
  private prepareFuseSearchList(): void {
    this.fuseBrandSearchList = Object.entries(BRANDS_CONFIG).map(([keyInConfig, brandData]) => {
      const searchTerms: string[] = [this.normalizeString(brandData.displayName)];

      if (brandData.aliases) {
        brandData.aliases.forEach(alias => {
          const normalizedAlias = this.normalizeString(alias);
          if (normalizedAlias) searchTerms.push(normalizedAlias);
        });
      }

      const normalizedKey = this.normalizeString(keyInConfig);
      if (normalizedKey) searchTerms.push(normalizedKey);

      return {
        keyInConfig,
        searchTerms: [...new Set(searchTerms.filter(term => term && term.length > 1))],
        brandConfigData: brandData
      };
    });

    const fuseOptions = {
      keys: ['searchTerms'],
      includeScore: true,
      threshold: 0.1,
      minMatchCharLength: 2,
      ignoreLocation: true
    };

    this.fuse = new Fuse(this.fuseBrandSearchList, fuseOptions);
    console.log('Fuse.js inizializzato con', this.fuseBrandSearchList.length, 'brand');
  }

  // Whitelist methods
  addToWhitelist(normalizedPlaceName: string, brandKey: string): void {
    if (!this.brandWhitelist[normalizedPlaceName]) {
      this.brandWhitelist[normalizedPlaceName] = [];
    }
    if (!this.brandWhitelist[normalizedPlaceName].includes(brandKey)) {
      this.brandWhitelist[normalizedPlaceName].push(brandKey);
    }
    this.saveLists();
  }

  isInWhitelist(normalizedPlaceName: string, brandKey: string): boolean {
    return this.brandWhitelist[normalizedPlaceName]?.includes(brandKey) || false;
  }

  removeFromWhitelist(normalizedPlaceName: string, brandKey: string): void {
    if (this.brandWhitelist[normalizedPlaceName]) {
      this.brandWhitelist[normalizedPlaceName] = this.brandWhitelist[normalizedPlaceName]
        .filter(k => k !== brandKey);
      if (this.brandWhitelist[normalizedPlaceName].length === 0) {
        delete this.brandWhitelist[normalizedPlaceName];
      }
      this.saveLists();
    }
  }

  clearWhitelist(): void {
    this.brandWhitelist = {};
    localStorage.removeItem(STORAGE_KEYS.whitelist);
  }

  // Blacklist methods
  addToBlacklist(normalizedPlaceName: string, brandKey: string): void {
    if (!this.brandBlacklist[normalizedPlaceName]) {
      this.brandBlacklist[normalizedPlaceName] = [];
    }
    if (!this.brandBlacklist[normalizedPlaceName].includes(brandKey)) {
      this.brandBlacklist[normalizedPlaceName].push(brandKey);
    }
    this.saveLists();
  }

  isInBlacklist(normalizedPlaceName: string, brandKey: string): boolean {
    return this.brandBlacklist[normalizedPlaceName]?.includes(brandKey) || false;
  }

  removeFromBlacklist(normalizedPlaceName: string, brandKey: string): void {
    if (this.brandBlacklist[normalizedPlaceName]) {
      this.brandBlacklist[normalizedPlaceName] = this.brandBlacklist[normalizedPlaceName]
        .filter(k => k !== brandKey);
      if (this.brandBlacklist[normalizedPlaceName].length === 0) {
        delete this.brandBlacklist[normalizedPlaceName];
      }
      this.saveLists();
    }
  }

  clearBlacklist(): void {
    this.brandBlacklist = {};
    localStorage.removeItem(STORAGE_KEYS.blacklist);
  }

  clearAllLists(): void {
    this.clearWhitelist();
    this.clearBlacklist();
  }

  // Match brand principale
  matchBrand(placeName: string, googleCategoryKey?: string): BrandMatchResult {
    const normalizedPlaceName = this.normalizeString(placeName);

    if (!normalizedPlaceName || normalizedPlaceName.length < 2) {
      return { isBrand: false };
    }

    // 1. WHITELIST CHECK
    for (const brandEntry of this.fuseBrandSearchList) {
      if (this.isInWhitelist(normalizedPlaceName, brandEntry.keyInConfig)) {
        console.log(`WHITELIST MATCH: "${normalizedPlaceName}" -> ${brandEntry.brandConfigData.displayName}`);
        return {
          isBrand: true,
          brandData: brandEntry.brandConfigData,
          keyInConfig: brandEntry.keyInConfig,
          matchMethod: 'whitelist_match',
          score: 0.0,
          matchDetails: `Whitelist confirmed match for "${normalizedPlaceName}"`
        };
      }
    }

    // 2. BLACKLIST CHECK - skip brands in blacklist

    // 3. EXACT MATCH
    for (const brandEntry of this.fuseBrandSearchList) {
      if (this.isInBlacklist(normalizedPlaceName, brandEntry.keyInConfig)) continue;

      for (const searchTerm of brandEntry.searchTerms) {
        if (normalizedPlaceName === searchTerm) {
          console.log(`EXACT MATCH: "${normalizedPlaceName}" -> ${brandEntry.brandConfigData.displayName}`);
          return {
            isBrand: true,
            brandData: brandEntry.brandConfigData,
            keyInConfig: brandEntry.keyInConfig,
            matchMethod: 'exact_match',
            score: 0.0,
            matchDetails: `Exact match: "${normalizedPlaceName}" === "${searchTerm}"`
          };
        }
      }
    }

    // 4. PREFIX MATCH
    for (const brandEntry of this.fuseBrandSearchList) {
      if (this.isInBlacklist(normalizedPlaceName, brandEntry.keyInConfig)) continue;

      const sortedSearchTerms = [...brandEntry.searchTerms].sort((a, b) => b.length - a.length);

      for (const searchTerm of sortedSearchTerms) {
        if (searchTerm.length < 2) continue;

        if (normalizedPlaceName.startsWith(searchTerm) && normalizedPlaceName !== searchTerm) {
          const brandCategoryInConfig = brandEntry.brandConfigData.category;

          if (googleCategoryKey && brandCategoryInConfig === googleCategoryKey) {
            console.log(`PREFIX MATCH with category: "${normalizedPlaceName}" -> ${brandEntry.brandConfigData.displayName}`);
            return {
              isBrand: true,
              brandData: brandEntry.brandConfigData,
              keyInConfig: brandEntry.keyInConfig,
              matchMethod: 'prefix_match_with_category',
              score: 0.1
            };
          } else {
            const matchRatio = searchTerm.length / normalizedPlaceName.length;
            if (matchRatio > 0.7) {
              console.log(`PREFIX MATCH: "${normalizedPlaceName}" -> ${brandEntry.brandConfigData.displayName}`);
              return {
                isBrand: true,
                brandData: brandEntry.brandConfigData,
                keyInConfig: brandEntry.keyInConfig,
                matchMethod: 'prefix_match_no_category',
                score: 0.15
              };
            }
          }
        }
      }
    }

    // 5. CONTAINS MATCH
    for (const brandEntry of this.fuseBrandSearchList) {
      if (this.isInBlacklist(normalizedPlaceName, brandEntry.keyInConfig)) continue;

      const sortedSearchTerms = [...brandEntry.searchTerms].sort((a, b) => b.length - a.length);

      for (const searchTerm of sortedSearchTerms) {
        if (searchTerm.length < 3) continue;

        if (normalizedPlaceName.includes(searchTerm) && !normalizedPlaceName.startsWith(searchTerm)) {
          const brandCategoryInConfig = brandEntry.brandConfigData.category;

          if (googleCategoryKey && brandCategoryInConfig === googleCategoryKey) {
            const regex = new RegExp(`\\b${searchTerm}\\b`);
            if (regex.test(normalizedPlaceName)) {
              console.log(`CONTAINS MATCH: "${searchTerm}" in "${normalizedPlaceName}" -> ${brandEntry.brandConfigData.displayName}`);
              return {
                isBrand: true,
                brandData: brandEntry.brandConfigData,
                keyInConfig: brandEntry.keyInConfig,
                matchMethod: 'contains_match',
                score: 0.2
              };
            }
          }
        }
      }
    }

    // 6. FUZZY MATCH con Fuse.js
    if (this.fuse) {
      const fuseResults = this.fuse.search(normalizedPlaceName);

      for (const result of fuseResults) {
        if (this.isInBlacklist(normalizedPlaceName, result.item.keyInConfig)) continue;
        if (result.score === undefined || result.score > 0.1) continue;

        const brandConfigData = result.item.brandConfigData;

        // Near-perfect fuzzy match
        if (result.score < 0.05) {
          console.log(`FUZZY NEAR-PERFECT: "${normalizedPlaceName}" -> ${brandConfigData.displayName} (score: ${result.score})`);
          return {
            isBrand: true,
            brandData: brandConfigData,
            keyInConfig: result.item.keyInConfig,
            matchMethod: 'fuzzy_near_perfect',
            score: result.score
          };
        }

        // Fuzzy match with category validation
        if (googleCategoryKey && brandConfigData.category === googleCategoryKey) {
          console.log(`FUZZY MATCH with category: "${normalizedPlaceName}" -> ${brandConfigData.displayName} (score: ${result.score})`);
          return {
            isBrand: true,
            brandData: brandConfigData,
            keyInConfig: result.item.keyInConfig,
            matchMethod: 'fuzzy_with_category',
            score: result.score
          };
        }
      }
    }

    return { isBrand: false };
  }

  // Classifica un singolo POI
  classifyPlace(placeName: string, googleTypes: string[], suggestedCategory?: string): BrandClassification {
    const googleCategoryKey = this.getGoogleCategoryKey(googleTypes);
    const brandMatchResult = this.matchBrand(placeName, googleCategoryKey || suggestedCategory);

    const classification: BrandClassification = {
      type: 'local',
      assignedMacroCategoryKey: suggestedCategory || googleCategoryKey || 'Negozi e Shopping',
      brandKeyFromConfig: null,
      brandDisplayName: null,
      brandConfigCategory: null,
      brandConfigSubCategory: null,
      matchMethod: null,
      similarityScore: null,
      isUserConfirmed: false
    };

    if (brandMatchResult.isBrand && brandMatchResult.brandData) {
      classification.type = 'brand';
      classification.brandKeyFromConfig = brandMatchResult.keyInConfig || null;
      classification.brandDisplayName = brandMatchResult.brandData.displayName;
      classification.brandConfigCategory = brandMatchResult.brandData.category;
      classification.brandConfigSubCategory = brandMatchResult.brandData.subCategory || null;
      classification.matchMethod = brandMatchResult.matchMethod || null;
      classification.similarityScore = brandMatchResult.score ?? null;
      classification.assignedMacroCategoryKey = brandMatchResult.brandData.category;

      if (brandMatchResult.matchMethod === 'whitelist_match') {
        classification.isUserConfirmed = true;
      }
    }

    return classification;
  }

  // Mappa Google Places types alla nostra categoria
  private getGoogleCategoryKey(googleTypes: string[]): string | null {
    for (const [categoryKey, categoryConfig] of Object.entries(CATEGORIES_CONFIG)) {
      for (const type of googleTypes) {
        if (categoryConfig.types.includes(type)) {
          return categoryKey;
        }
      }
    }
    return null;
  }

  // Conferma associazione brand (whitelist)
  confirmBrandAssociation(placeName: string, brandKey: string): void {
    const normalizedName = this.normalizeString(placeName);
    this.addToWhitelist(normalizedName, brandKey);
    // Rimuovi dalla blacklist se presente
    this.removeFromBlacklist(normalizedName, brandKey);
  }

  // Rimuovi associazione brand (blacklist)
  removeBrandAssociation(placeName: string, brandKey: string): void {
    const normalizedName = this.normalizeString(placeName);
    this.addToBlacklist(normalizedName, brandKey);
    // Rimuovi dalla whitelist se presente
    this.removeFromWhitelist(normalizedName, brandKey);
  }

  // Getters
  getCategoriesConfig(): Record<string, CategoryConfig> {
    return CATEGORIES_CONFIG;
  }

  getBrandsConfig(): Record<string, BrandConfig> {
    return BRANDS_CONFIG;
  }

  getWhitelistCount(): number {
    return Object.keys(this.brandWhitelist).length;
  }

  getBlacklistCount(): number {
    return Object.keys(this.brandBlacklist).length;
  }
}

// Singleton instance
export const brandService = new BrandService();
export default brandService;
