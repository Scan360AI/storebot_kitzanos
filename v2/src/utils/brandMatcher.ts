// Brand matching utility using Fuse.js for fuzzy search
// Based on original context_analyzer.js logic

import Fuse from 'fuse.js';
import { BRANDS_CONFIG, BrandConfig, normalizeString } from '../config/brands';

export interface BrandSearchItem {
  keyInConfig: string;
  searchTerms: string[];
  brandConfigData: BrandConfig;
}

export interface BrandMatchResult {
  brand: BrandConfig;
  brandKey: string;
  score: number;
  isPerfectMatch: boolean;
  matchType: 'perfect' | 'fuzzy' | 'none';
}

export interface POIClassification {
  isBrand: boolean;
  brandName?: string;
  brandKey?: string;
  brandData?: BrandConfig;
  matchScore?: number;
  matchType?: 'perfect' | 'fuzzy';
  isWhitelisted?: boolean;
  isBlacklisted?: boolean;
}

class BrandMatcher {
  private fuse: Fuse<BrandSearchItem> | null = null;
  private fuseBrandSearchList: BrandSearchItem[] = [];
  private whitelist: Set<string> = new Set();
  private blacklist: Set<string> = new Set();

  constructor() {
    this.initializeFuse();
    this.loadWhitelistBlacklist();
  }

  // Initialize Fuse.js with brand search list
  private initializeFuse() {
    // Prepare search list from ALL_BRANDS_CONFIG
    this.fuseBrandSearchList = Object.entries(BRANDS_CONFIG).map(
      ([keyInConfig, brandData]) => {
        const searchTerms = [normalizeString(brandData.displayName)];

        // Add aliases to search terms
        if (brandData.aliases) {
          brandData.aliases.forEach((alias) => {
            searchTerms.push(normalizeString(alias));
          });
        }

        return {
          keyInConfig,
          searchTerms,
          brandConfigData: brandData,
        };
      }
    );

    // Configure Fuse.js options (matching original)
    const fuseOptions: Fuse.IFuseOptions<BrandSearchItem> = {
      keys: ['searchTerms'],
      includeScore: true,
      threshold: 0.1, // Low threshold for strict matching
      minMatchCharLength: 2,
      ignoreLocation: true,
    };

    this.fuse = new Fuse(this.fuseBrandSearchList, fuseOptions);
  }

  // Load whitelist and blacklist from localStorage
  private loadWhitelistBlacklist() {
    try {
      const whitelistData = localStorage.getItem('brand_whitelist');
      const blacklistData = localStorage.getItem('brand_blacklist');

      if (whitelistData) {
        this.whitelist = new Set(JSON.parse(whitelistData));
      }
      if (blacklistData) {
        this.blacklist = new Set(JSON.parse(blacklistData));
      }
    } catch (error) {
      console.error('Error loading whitelist/blacklist:', error);
    }
  }

  // Save whitelist and blacklist to localStorage
  private saveWhitelistBlacklist() {
    try {
      localStorage.setItem('brand_whitelist', JSON.stringify([...this.whitelist]));
      localStorage.setItem('brand_blacklist', JSON.stringify([...this.blacklist]));
    } catch (error) {
      console.error('Error saving whitelist/blacklist:', error);
    }
  }

  // Add to whitelist
  addToWhitelist(poiName: string, brandKey: string) {
    const key = `${normalizeString(poiName)}:${brandKey}`;
    this.whitelist.add(key);
    // Remove from blacklist if present
    this.blacklist.delete(key);
    this.saveWhitelistBlacklist();
  }

  // Add to blacklist
  addToBlacklist(poiName: string, brandKey: string) {
    const key = `${normalizeString(poiName)}:${brandKey}`;
    this.blacklist.add(key);
    // Remove from whitelist if present
    this.whitelist.delete(key);
    this.saveWhitelistBlacklist();
  }

  // Check if POI-brand combination is whitelisted
  isWhitelisted(poiName: string, brandKey: string): boolean {
    const key = `${normalizeString(poiName)}:${brandKey}`;
    return this.whitelist.has(key);
  }

  // Check if POI-brand combination is blacklisted
  isBlacklisted(poiName: string, brandKey: string): boolean {
    const key = `${normalizeString(poiName)}:${brandKey}`;
    return this.blacklist.has(key);
  }

  // Find brand match for a POI name
  findBrandMatch(poiName: string): BrandMatchResult | null {
    if (!poiName || !this.fuse) return null;

    const normalizedName = normalizeString(poiName);

    // Try perfect match first
    for (const item of this.fuseBrandSearchList) {
      for (const term of item.searchTerms) {
        if (normalizedName === term || normalizedName.includes(term)) {
          return {
            brand: item.brandConfigData,
            brandKey: item.keyInConfig,
            score: 0,
            isPerfectMatch: true,
            matchType: 'perfect',
          };
        }
      }
    }

    // Try fuzzy match with Fuse.js
    const results = this.fuse.search(normalizedName);

    if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.1) {
      const match = results[0];
      return {
        brand: match.item.brandConfigData,
        brandKey: match.item.keyInConfig,
        score: match.score,
        isPerfectMatch: false,
        matchType: 'fuzzy',
      };
    }

    return null;
  }

  // Classify a POI as brand or local
  classifyPOI(poiName: string): POIClassification {
    const match = this.findBrandMatch(poiName);

    if (!match) {
      return { isBrand: false };
    }

    // Check whitelist/blacklist
    const isWhitelisted = this.isWhitelisted(poiName, match.brandKey);
    const isBlacklisted = this.isBlacklisted(poiName, match.brandKey);

    // If blacklisted, treat as local
    if (isBlacklisted) {
      return { isBrand: false };
    }

    // If whitelisted or perfect match, treat as brand
    if (isWhitelisted || match.isPerfectMatch) {
      return {
        isBrand: true,
        brandName: match.brand.displayName,
        brandKey: match.brandKey,
        brandData: match.brand,
        matchScore: match.score,
        matchType: match.matchType,
        isWhitelisted,
      };
    }

    // Fuzzy match without whitelist - return as uncertain
    return {
      isBrand: true,
      brandName: match.brand.displayName,
      brandKey: match.brandKey,
      brandData: match.brand,
      matchScore: match.score,
      matchType: match.matchType,
      isWhitelisted: false,
    };
  }
}

// Export singleton instance
export const brandMatcher = new BrandMatcher();
