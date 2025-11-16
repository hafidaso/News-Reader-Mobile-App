import axios from 'axios';
import { NewsApiResponse, Category } from '../types';
import { NEWS_API_CONFIG } from '../constants/config';
import { cacheStorage } from './cacheStorage';

const newsApiClient = axios.create({
  baseURL: NEWS_API_CONFIG.baseUrl,
  timeout: 10000,
  headers: {
    'X-Api-Key': NEWS_API_CONFIG.apiKey,
  },
});

export const newsApi = {
  /**
   * Fetch top headlines by category
   */
  getTopHeadlines: async (
    category: Category = 'general',
    page: number = 1,
    useCache: boolean = true
  ): Promise<NewsApiResponse> => {
    const cacheKey = cacheStorage.generateCacheKey('category', `${category}_page${page}`);

    // Only use cache for page 1 to ensure fresh data on pagination
    if (useCache && page === 1) {
      const cachedData = await cacheStorage.getCachedArticles(cacheKey);
      if (cachedData) {
        console.log('Using cached data for category:', category, 'page:', page);
        return cachedData;
      }
    }

    try {
      const response = await newsApiClient.get<NewsApiResponse>('/top-headlines', {
        params: {
          country: NEWS_API_CONFIG.country,
          category: category,
          pageSize: NEWS_API_CONFIG.pageSize,
          page: page,
        },
      });

      // Cache the response (only page 1 for simplicity)
      if (page === 1) {
      await cacheStorage.cacheArticles(cacheKey, response.data, {
        key: cacheKey,
        category: category,
      });
      }

      return response.data;
    } catch (error) {
      // If network fails, try to return cached data even if expired (only for page 1)
      if (page === 1) {
      const cachedData = await cacheStorage.getCachedArticles(cacheKey);
      if (cachedData) {
        console.log('Network failed, using stale cache for category:', category);
        return cachedData;
        }
      }

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to fetch news. Please check your connection.'
        );
      }
      throw new Error('An unexpected error occurred while fetching news.');
    }
  },

  /**
   * Search for news articles by keyword
   */
  searchNews: async (
    query: string,
    page: number = 1,
    useCache: boolean = true
  ): Promise<NewsApiResponse> => {
    const cacheKey = cacheStorage.generateCacheKey('search', `${query}_page${page}`);

    // Only use cache for page 1 to ensure fresh data on pagination
    if (useCache && page === 1) {
      const cachedData = await cacheStorage.getCachedArticles(cacheKey);
      if (cachedData) {
        console.log('Using cached data for search:', query, 'page:', page);
        return cachedData;
      }
    }

    try {
      const response = await newsApiClient.get<NewsApiResponse>('/everything', {
        params: {
          q: query,
          pageSize: NEWS_API_CONFIG.pageSize,
          sortBy: 'publishedAt',
          page: page,
        },
      });

      // Cache the response (only page 1 for simplicity)
      if (page === 1) {
      await cacheStorage.cacheArticles(cacheKey, response.data, {
        key: cacheKey,
        query: query,
      });
      }

      return response.data;
    } catch (error) {
      // If network fails, try to return cached data even if expired (only for page 1)
      if (page === 1) {
      const cachedData = await cacheStorage.getCachedArticles(cacheKey);
      if (cachedData) {
        console.log('Network failed, using stale cache for search:', query);
        return cachedData;
        }
      }

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to search news. Please check your connection.'
        );
      }
      throw new Error('An unexpected error occurred while searching.');
    }
  },
};

