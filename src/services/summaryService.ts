import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../types';

const SUMMARIES_STORAGE_KEY = '@summaries';
const SETTINGS_STORAGE_KEY = '@summary_settings';

// OpenRouter API (free tier with various models)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ArticleSummary {
  articleUrl: string;
  articleTitle: string;
  summary: string; // TL;DR
  keyPoints: string[]; // Bullet points
  readingTime: number; // in minutes
  generatedAt: number;
  model: string;
}

export interface SummarySettings {
  enabled: boolean;
  autoGenerate: boolean; // Generate on article open
  model: string;
  apiKey: string;
  maxKeyPoints: number;
}

const DEFAULT_SETTINGS: SummarySettings = {
  enabled: false,
  autoGenerate: false,
  model: 'openai/gpt-3.5-turbo', // Free tier model
  apiKey: '',
  maxKeyPoints: 5,
};

class SummaryService {
  /**
   * ========== SETTINGS MANAGEMENT ==========
   */

  async getSettings(): Promise<SummarySettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting summary settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(settings: Partial<SummarySettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating summary settings:', error);
      throw error;
    }
  }

  /**
   * ========== SUMMARY STORAGE ==========
   */

  async getSummaries(): Promise<ArticleSummary[]> {
    try {
      const data = await AsyncStorage.getItem(SUMMARIES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting summaries:', error);
      return [];
    }
  }

  async getSummary(articleUrl: string): Promise<ArticleSummary | null> {
    try {
      const summaries = await this.getSummaries();
      return summaries.find(s => s.articleUrl === articleUrl) || null;
    } catch (error) {
      console.error('Error getting summary:', error);
      return null;
    }
  }

  async saveSummary(summary: ArticleSummary): Promise<void> {
    try {
      const summaries = await this.getSummaries();
      const index = summaries.findIndex(s => s.articleUrl === summary.articleUrl);
      
      if (index >= 0) {
        summaries[index] = summary;
      } else {
        summaries.unshift(summary);
      }

      // Keep only last 100 summaries
      if (summaries.length > 100) {
        summaries.splice(100);
      }

      await AsyncStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(summaries));
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  }

  async deleteSummary(articleUrl: string): Promise<void> {
    try {
      const summaries = await this.getSummaries();
      const filtered = summaries.filter(s => s.articleUrl !== articleUrl);
      await AsyncStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting summary:', error);
      throw error;
    }
  }

  async clearAllSummaries(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SUMMARIES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing summaries:', error);
      throw error;
    }
  }

  /**
   * ========== READING TIME ESTIMATION ==========
   */

  estimateReadingTime(text: string): number {
    // Average reading speed: 200-250 words per minute
    // We'll use 225 as a middle ground
    const wordsPerMinute = 225;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return Math.max(1, minutes); // Minimum 1 minute
  }

  calculateArticleReadingTime(article: Article): number {
    let totalText = '';
    
    if (article.title) totalText += article.title + ' ';
    if (article.description) totalText += article.description + ' ';
    if (article.content) totalText += article.content;
    
    // If we have content, use it. Otherwise, estimate based on description
    if (totalText.length > 100) {
      return this.estimateReadingTime(totalText);
    }
    
    // Default estimate for news articles without full content
    return 3;
  }

  /**
   * ========== AI SUMMARIZATION ==========
   */

  async generateSummaryWithAI(article: Article): Promise<ArticleSummary> {
    const settings = await this.getSettings();
    
    if (!settings.apiKey) {
      throw new Error('API key not configured. Please set your OpenRouter API key in settings.');
    }

    // Prepare article text
    let articleText = '';
    if (article.title) articleText += `Title: ${article.title}\n\n`;
    if (article.description) articleText += `${article.description}\n\n`;
    if (article.content) {
      // Clean up content (remove [+XXX chars] markers)
      const cleanContent = article.content.replace(/\[\+\d+ chars\]/g, '');
      articleText += cleanContent;
    }

    if (articleText.length < 50) {
      throw new Error('Article content is too short to summarize.');
    }

    // Create prompt
    const prompt = `Please analyze this news article and provide:

1. A concise TL;DR summary (2-3 sentences)
2. ${settings.maxKeyPoints} key points as bullet points

Article:
${articleText}

Please respond in the following JSON format:
{
  "summary": "Your TL;DR here",
  "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]
}`;

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
          'HTTP-Referer': 'https://hafida-belayd.me/',
          'X-Title': 'News Reader App',
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes news articles concisely and extracts key points. Always respond with valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI model');
      }

      // Parse JSON response
      let parsedContent;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        parsedContent = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Failed to parse AI response. Please try again.');
      }

      // Calculate reading time
      const readingTime = this.calculateArticleReadingTime(article);

      // Create summary object
      const summary: ArticleSummary = {
        articleUrl: article.url,
        articleTitle: article.title,
        summary: parsedContent.summary || 'Summary not available',
        keyPoints: Array.isArray(parsedContent.keyPoints) 
          ? parsedContent.keyPoints.slice(0, settings.maxKeyPoints)
          : [],
        readingTime,
        generatedAt: Date.now(),
        model: settings.model,
      };

      // Save to storage
      await this.saveSummary(summary);

      return summary;
    } catch (error: any) {
      console.error('AI summarization error:', error);
      
      // Return fallback summary
      return this.generateFallbackSummary(article);
    }
  }

  /**
   * ========== FALLBACK SUMMARIZATION ==========
   * Used when AI is unavailable or API fails
   */

  generateFallbackSummary(article: Article): ArticleSummary {
    // Use article description as summary
    const summary = article.description || 'Summary not available';
    
    // Extract key points from description and content
    const keyPoints: string[] = [];
    
    if (article.description) {
      // Split by common sentence delimiters and take first few
      const sentences = article.description
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 200);
      
      keyPoints.push(...sentences.slice(0, 3));
    }

    // If we don't have enough points, add a generic one
    if (keyPoints.length < 2) {
      keyPoints.push(`Source: ${article.source.name}`);
      if (article.author) {
        keyPoints.push(`Author: ${article.author}`);
      }
    }

    const readingTime = this.calculateArticleReadingTime(article);

    return {
      articleUrl: article.url,
      articleTitle: article.title,
      summary,
      keyPoints: keyPoints.slice(0, 5),
      readingTime,
      generatedAt: Date.now(),
      model: 'fallback',
    };
  }

  /**
   * ========== SMART SUMMARY GENERATION ==========
   */

  async getOrGenerateSummary(article: Article, forceAI: boolean = false): Promise<ArticleSummary> {
    // Check if we have a cached summary
    const cached = await this.getSummary(article.url);
    
    if (cached && !forceAI) {
      // Check if summary is less than 7 days old
      const age = Date.now() - cached.generatedAt;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (age < sevenDays) {
        return cached;
      }
    }

    // Generate new summary
    const settings = await this.getSettings();
    
    if (settings.enabled && settings.apiKey && forceAI) {
      try {
        return await this.generateSummaryWithAI(article);
      } catch (error) {
        console.warn('AI generation failed, using fallback:', error);
        return this.generateFallbackSummary(article);
      }
    }

    // Use fallback if AI is disabled or no API key
    const fallback = this.generateFallbackSummary(article);
    await this.saveSummary(fallback);
    return fallback;
  }

  /**
   * ========== BATCH OPERATIONS ==========
   */

  async generateSummariesForArticles(articles: Article[]): Promise<void> {
    const settings = await this.getSettings();
    
    if (!settings.autoGenerate || !settings.enabled) {
      return;
    }

    // Generate summaries in background (don't wait)
    for (const article of articles) {
      // Check if we already have a recent summary
      const existing = await this.getSummary(article.url);
      if (existing) {
        const age = Date.now() - existing.generatedAt;
        if (age < 24 * 60 * 60 * 1000) { // Less than 24 hours old
          continue;
        }
      }

      // Generate fallback summary immediately (fast)
      const fallback = this.generateFallbackSummary(article);
      await this.saveSummary(fallback);
    }
  }

  /**
   * ========== UTILITIES ==========
   */

  formatReadingTime(minutes: number): string {
    if (minutes < 1) return '< 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }

  async getStatistics(): Promise<{
    totalSummaries: number;
    aiGenerated: number;
    fallbackGenerated: number;
    averageReadingTime: number;
  }> {
    try {
      const summaries = await this.getSummaries();
      const aiGenerated = summaries.filter(s => s.model !== 'fallback').length;
      const totalReadingTime = summaries.reduce((sum, s) => sum + s.readingTime, 0);
      
      return {
        totalSummaries: summaries.length,
        aiGenerated,
        fallbackGenerated: summaries.length - aiGenerated,
        averageReadingTime: summaries.length > 0 
          ? Math.round(totalReadingTime / summaries.length) 
          : 0,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalSummaries: 0,
        aiGenerated: 0,
        fallbackGenerated: 0,
        averageReadingTime: 0,
      };
    }
  }
}

export const summaryService = new SummaryService();

