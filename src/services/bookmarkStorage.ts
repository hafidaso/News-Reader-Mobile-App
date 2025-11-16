import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../types';

const BOOKMARKS_KEY = '@news_reader_bookmarks';

export const bookmarkStorage = {
  /**
   * Get all bookmarked articles
   */
  getBookmarks: async (): Promise<Article[]> => {
    try {
      const bookmarksJson = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarksJson) {
        return JSON.parse(bookmarksJson);
      }
      return [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  },

  /**
   * Add article to bookmarks
   */
  addBookmark: async (article: Article): Promise<void> => {
    try {
      const bookmarks = await bookmarkStorage.getBookmarks();
      
      // Check if article already bookmarked (by URL)
      const isAlreadyBookmarked = bookmarks.some(
        (item) => item.url === article.url
      );
      
      if (!isAlreadyBookmarked) {
        const updatedBookmarks = [article, ...bookmarks];
        await AsyncStorage.setItem(
          BOOKMARKS_KEY,
          JSON.stringify(updatedBookmarks)
        );
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw new Error('Failed to save bookmark');
    }
  },

  /**
   * Remove article from bookmarks
   */
  removeBookmark: async (articleUrl: string): Promise<void> => {
    try {
      const bookmarks = await bookmarkStorage.getBookmarks();
      const updatedBookmarks = bookmarks.filter(
        (item) => item.url !== articleUrl
      );
      await AsyncStorage.setItem(
        BOOKMARKS_KEY,
        JSON.stringify(updatedBookmarks)
      );
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw new Error('Failed to remove bookmark');
    }
  },

  /**
   * Check if article is bookmarked
   */
  isBookmarked: async (articleUrl: string): Promise<boolean> => {
    try {
      const bookmarks = await bookmarkStorage.getBookmarks();
      return bookmarks.some((item) => item.url === articleUrl);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  },

  /**
   * Clear all bookmarks
   */
  clearAllBookmarks: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(BOOKMARKS_KEY);
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
      throw new Error('Failed to clear bookmarks');
    }
  },

  /**
   * Get bookmarks count
   */
  getBookmarksCount: async (): Promise<number> => {
    try {
      const bookmarks = await bookmarkStorage.getBookmarks();
      return bookmarks.length;
    } catch (error) {
      console.error('Error getting bookmarks count:', error);
      return 0;
    }
  },
};

