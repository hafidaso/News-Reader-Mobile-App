import { Article } from '../types';

class NavigationHistoryService {
  private history: Article[] = [];
  private currentIndex: number = -1;

  /**
   * Add article to history
   */
  addToHistory(article: Article): void {
    // Remove any forward history when adding new article
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new article
    this.history.push(article);
    this.currentIndex = this.history.length - 1;
  }

  /**
   * Go back in history
   */
  goBack(): Article | null {
    if (this.canGoBack()) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Go forward in history
   */
  goForward(): Article | null {
    if (this.canGoForward()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Check if can go back
   */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if can go forward
   */
  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current article
   */
  getCurrentArticle(): Article | null {
    return this.history[this.currentIndex] || null;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * Get current position
   */
  getCurrentPosition(): { current: number; total: number } {
    return {
      current: this.currentIndex + 1,
      total: this.history.length,
    };
  }
}

export const navigationHistory = new NavigationHistoryService();

