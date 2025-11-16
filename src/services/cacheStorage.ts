import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article, NewsApiResponse } from '../types';

const CACHE_PREFIX = '@news_cache_';
const CACHE_METADATA_KEY = '@news_cache_metadata';
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

interface CacheMetadata {
  key: string;
  timestamp: number;
  category?: string;
  query?: string;
}

interface CacheEntry {
  data: NewsApiResponse;
  timestamp: number;
}

export const cacheStorage = {
  /**
   * Generate cache key based on request type
   */
  generateCacheKey: (type: 'category' | 'search', value: string): string => {
    return `${CACHE_PREFIX}${type}_${value}`;
  },

  /**
   * Save articles to cache
   */
  cacheArticles: async (
    key: string,
    data: NewsApiResponse,
    metadata: Omit<CacheMetadata, 'timestamp'>
  ): Promise<void> => {
    try {
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
      };

      // Save the cached data
      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));

      // Update metadata
      const existingMetadata = await cacheStorage.getCacheMetadata();
      const newMetadata: CacheMetadata = {
        ...metadata,
        timestamp: Date.now(),
      };

      // Remove old entry if exists, add new one
      const updatedMetadata = [
        newMetadata,
        ...existingMetadata.filter(m => m.key !== key),
      ];

      await AsyncStorage.setItem(
        CACHE_METADATA_KEY,
        JSON.stringify(updatedMetadata)
      );
    } catch (error) {
      console.error('Error caching articles:', error);
    }
  },

  /**
   * Get cached articles
   */
  getCachedArticles: async (key: string): Promise<NewsApiResponse | null> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheEntry: CacheEntry = JSON.parse(cached);
      const age = Date.now() - cacheEntry.timestamp;
      const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      // Check if cache is expired
      if (age > maxAge) {
        await cacheStorage.clearCache(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  },

  /**
   * Check if cache exists and is valid
   */
  isCacheValid: async (key: string): Promise<boolean> => {
    const cached = await cacheStorage.getCachedArticles(key);
    return cached !== null;
  },

  /**
   * Get cache metadata
   */
  getCacheMetadata: async (): Promise<CacheMetadata[]> => {
    try {
      const metadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      return metadata ? JSON.parse(metadata) : [];
    } catch (error) {
      console.error('Error reading cache metadata:', error);
      return [];
    }
  },

  /**
   * Clear specific cache
   */
  clearCache: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);

      // Update metadata
      const metadata = await cacheStorage.getCacheMetadata();
      const updatedMetadata = metadata.filter(m => m.key !== key);
      await AsyncStorage.setItem(
        CACHE_METADATA_KEY,
        JSON.stringify(updatedMetadata)
      );
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  /**
   * Clear all expired cache
   */
  clearExpiredCache: async (): Promise<void> => {
    try {
      const metadata = await cacheStorage.getCacheMetadata();
      const now = Date.now();
      const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      const expiredKeys = metadata
        .filter(m => now - m.timestamp > maxAge)
        .map(m => m.key);

      for (const key of expiredKeys) {
        await cacheStorage.clearCache(key);
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  },

  /**
   * Clear all cache
   */
  clearAllCache: async (): Promise<void> => {
    try {
      const metadata = await cacheStorage.getCacheMetadata();
      
      for (const item of metadata) {
        await AsyncStorage.removeItem(item.key);
      }

      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats: async (): Promise<{
    totalEntries: number;
    oldestCache: number | null;
    totalSize: number;
  }> => {
    try {
      const metadata = await cacheStorage.getCacheMetadata();
      const now = Date.now();

      let totalSize = 0;
      for (const item of metadata) {
        const cached = await AsyncStorage.getItem(item.key);
        if (cached) {
          totalSize += cached.length;
        }
      }

      const timestamps = metadata.map(m => m.timestamp);
      const oldestCache = timestamps.length > 0 ? Math.min(...timestamps) : null;

      return {
        totalEntries: metadata.length,
        oldestCache,
        totalSize,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalEntries: 0, oldestCache: null, totalSize: 0 };
    }
  },
};

