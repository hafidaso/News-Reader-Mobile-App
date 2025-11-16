import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../types';

const HISTORY_STORAGE_KEY = '@reading_history';
const MAX_HISTORY_ITEMS = 100; // Keep last 100 articles

export interface ReadingHistoryItem {
  article: Article;
  readAt: number; // timestamp
  readingTime: number; // seconds spent reading
  category: string;
  source: string;
}

export interface ReadingStats {
  totalArticlesRead: number;
  totalReadingTime: number; // in minutes
  averageReadingTime: number; // in minutes
  currentStreak: number; // days
  longestStreak: number; // days
  articlesReadToday: number;
  articlesReadThisWeek: number;
  articlesReadThisMonth: number;
  favoriteCategory: string;
  favoriteSource: string;
  categoriesBreakdown: { [key: string]: number };
  sourcesBreakdown: { [key: string]: number };
  readingByDay: { [key: string]: number }; // Last 7 days
  readingByHour: { [key: number]: number }; // 0-23 hours
}

class ReadingHistoryService {
  /**
   * Add an article to reading history
   */
  async addToHistory(
    article: Article,
    readingTime: number = 0,
    category: string = 'general'
  ): Promise<void> {
    try {
      const history = await this.getHistory();
      
      // Check if article already exists (by URL)
      const existingIndex = history.findIndex(item => item.article.url === article.url);
      
      const historyItem: ReadingHistoryItem = {
        article,
        readAt: Date.now(),
        readingTime,
        category,
        source: article.source?.name || 'Unknown',
      };

      if (existingIndex !== -1) {
        // Update existing entry (move to top)
        history.splice(existingIndex, 1);
      }

      // Add to beginning
      history.unshift(historyItem);

      // Keep only MAX_HISTORY_ITEMS
      if (history.length > MAX_HISTORY_ITEMS) {
        history.splice(MAX_HISTORY_ITEMS);
      }

      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  /**
   * Get full reading history
   */
  async getHistory(): Promise<ReadingHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  /**
   * Get recent history (last N items)
   */
  async getRecentHistory(limit: number = 10): Promise<ReadingHistoryItem[]> {
    const history = await this.getHistory();
    return history.slice(0, limit);
  }

  /**
   * Clear all reading history
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  /**
   * Remove specific item from history
   */
  async removeFromHistory(articleUrl: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filtered = history.filter(item => item.article.url !== articleUrl);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }

  /**
   * Calculate comprehensive reading statistics
   */
  async getStats(): Promise<ReadingStats> {
    const history = await this.getHistory();
    
    if (history.length === 0) {
      return this.getEmptyStats();
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const oneMonthMs = 30 * oneDayMs;

    // Basic stats
    const totalArticlesRead = history.length;
    const totalReadingTime = history.reduce((sum, item) => sum + item.readingTime, 0) / 60; // Convert to minutes
    const averageReadingTime = totalReadingTime / totalArticlesRead;

    // Time-based stats
    const articlesReadToday = history.filter(
      item => now - item.readAt < oneDayMs
    ).length;

    const articlesReadThisWeek = history.filter(
      item => now - item.readAt < oneWeekMs
    ).length;

    const articlesReadThisMonth = history.filter(
      item => now - item.readAt < oneMonthMs
    ).length;

    // Calculate streaks
    const streaks = this.calculateStreaks(history);

    // Categories breakdown
    const categoriesBreakdown: { [key: string]: number } = {};
    history.forEach(item => {
      const cat = item.category || 'general';
      categoriesBreakdown[cat] = (categoriesBreakdown[cat] || 0) + 1;
    });

    // Sources breakdown
    const sourcesBreakdown: { [key: string]: number } = {};
    history.forEach(item => {
      const source = item.source || 'Unknown';
      sourcesBreakdown[source] = (sourcesBreakdown[source] || 0) + 1;
    });

    // Find favorites
    const favoriteCategory = Object.entries(categoriesBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'general';

    const favoriteSource = Object.entries(sourcesBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';

    // Reading by day (last 7 days)
    const readingByDay = this.getReadingByDay(history);

    // Reading by hour (0-23)
    const readingByHour = this.getReadingByHour(history);

    return {
      totalArticlesRead,
      totalReadingTime,
      averageReadingTime,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      articlesReadToday,
      articlesReadThisWeek,
      articlesReadThisMonth,
      favoriteCategory,
      favoriteSource,
      categoriesBreakdown,
      sourcesBreakdown,
      readingByDay,
      readingByHour,
    };
  }

  /**
   * Calculate reading streaks (consecutive days)
   */
  private calculateStreaks(history: ReadingHistoryItem[]): { current: number; longest: number } {
    if (history.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Get unique days with reading activity
    const readingDays = new Set(
      history.map(item => this.getDateKey(new Date(item.readAt)))
    );

    const sortedDays = Array.from(readingDays).sort().reverse();
    
    const today = this.getDateKey(new Date());
    const yesterday = this.getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

    // Calculate current streak
    let currentStreak = 0;
    if (sortedDays.includes(today) || sortedDays.includes(yesterday)) {
      currentStreak = 1;
      let checkDate = sortedDays.includes(today) 
        ? new Date() 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (let i = 1; i < sortedDays.length; i++) {
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        const checkKey = this.getDateKey(checkDate);
        
        if (sortedDays.includes(checkKey)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < sortedDays.length - 1; i++) {
      const date1 = new Date(sortedDays[i]);
      const date2 = new Date(sortedDays[i + 1]);
      const dayDiff = Math.floor((date1.getTime() - date2.getTime()) / (24 * 60 * 60 * 1000));

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Get reading count by day (last 7 days)
   */
  private getReadingByDay(history: ReadingHistoryItem[]): { [key: string]: number } {
    const readingByDay: { [key: string]: number } = {};
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    history
      .filter(item => item.readAt > sevenDaysAgo)
      .forEach(item => {
        const dateKey = this.getDateKey(new Date(item.readAt));
        readingByDay[dateKey] = (readingByDay[dateKey] || 0) + 1;
      });

    // Fill in missing days with 0
    for (let i = 0; i < 7; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = this.getDateKey(date);
      if (!readingByDay[key]) {
        readingByDay[key] = 0;
      }
    }

    return readingByDay;
  }

  /**
   * Get reading count by hour (0-23)
   */
  private getReadingByHour(history: ReadingHistoryItem[]): { [key: number]: number } {
    const readingByHour: { [key: number]: number } = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      readingByHour[i] = 0;
    }

    history.forEach(item => {
      const hour = new Date(item.readAt).getHours();
      readingByHour[hour]++;
    });

    return readingByHour;
  }

  /**
   * Get date key for grouping (YYYY-MM-DD)
   */
  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get empty stats (no history)
   */
  private getEmptyStats(): ReadingStats {
    return {
      totalArticlesRead: 0,
      totalReadingTime: 0,
      averageReadingTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      articlesReadToday: 0,
      articlesReadThisWeek: 0,
      articlesReadThisMonth: 0,
      favoriteCategory: 'None',
      favoriteSource: 'None',
      categoriesBreakdown: {},
      sourcesBreakdown: {},
      readingByDay: {},
      readingByHour: {},
    };
  }

  /**
   * Check if article has been read
   */
  async hasBeenRead(articleUrl: string): Promise<boolean> {
    const history = await this.getHistory();
    return history.some(item => item.article.url === articleUrl);
  }

  /**
   * Get reading time for specific article
   */
  async getReadingTime(articleUrl: string): Promise<number> {
    const history = await this.getHistory();
    const item = history.find(item => item.article.url === articleUrl);
    return item?.readingTime || 0;
  }
}

export const readingHistoryService = new ReadingHistoryService();

