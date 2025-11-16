import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../types';

const COLLECTIONS_STORAGE_KEY = '@collections';
const TAGS_STORAGE_KEY = '@tags';
const ARTICLE_TAGS_STORAGE_KEY = '@article_tags';

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  articleUrls: string[];
  isSmartCollection: boolean;
  smartFilter?: {
    type: 'category' | 'source' | 'tag';
    value: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ArticleTag {
  articleUrl: string;
  tagIds: string[];
}

// Predefined colors for tags and collections
export const TAG_COLORS = [
  '#1DA1F2', // Blue
  '#2ECC71', // Green
  '#9B59B6', // Purple
  '#E74C3C', // Red
  '#E67E22', // Orange
  '#F39C12', // Yellow
  '#3498DB', // Light Blue
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#8BC34A', // Light Green
  '#FF5722', // Deep Orange
  '#607D8B', // Blue Grey
];

// Predefined icons for collections
export const COLLECTION_ICONS = [
  'folder',
  'briefcase',
  'school',
  'heart',
  'star',
  'bookmark',
  'trophy',
  'rocket',
  'bulb',
  'flag',
  'planet',
  'medical',
];

class TagsService {
  /**
   * ========== TAGS MANAGEMENT ==========
   */

  // Get all tags
  async getTags(): Promise<Tag[]> {
    try {
      const data = await AsyncStorage.getItem(TAGS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }

  // Create a new tag
  async createTag(name: string, color: string = TAG_COLORS[0]): Promise<Tag> {
    try {
      const tags = await this.getTags();
      
      // Check if tag with same name exists
      const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        throw new Error('Tag with this name already exists');
      }

      const newTag: Tag = {
        id: Date.now().toString(),
        name: name.trim(),
        color,
        createdAt: Date.now(),
      };

      tags.push(newTag);
      await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
      return newTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  // Update a tag
  async updateTag(tagId: string, updates: Partial<Tag>): Promise<void> {
    try {
      const tags = await this.getTags();
      const index = tags.findIndex(t => t.id === tagId);
      
      if (index === -1) {
        throw new Error('Tag not found');
      }

      tags[index] = { ...tags[index], ...updates };
      await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  }

  // Delete a tag
  async deleteTag(tagId: string): Promise<void> {
    try {
      const tags = await this.getTags();
      const filtered = tags.filter(t => t.id !== tagId);
      await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(filtered));

      // Also remove this tag from all articles
      const articleTags = await this.getAllArticleTags();
      const updatedArticleTags = articleTags.map(at => ({
        ...at,
        tagIds: at.tagIds.filter(id => id !== tagId),
      }));
      await AsyncStorage.setItem(ARTICLE_TAGS_STORAGE_KEY, JSON.stringify(updatedArticleTags));
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  /**
   * ========== ARTICLE TAGS ==========
   */

  // Get all article tags
  async getAllArticleTags(): Promise<ArticleTag[]> {
    try {
      const data = await AsyncStorage.getItem(ARTICLE_TAGS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting article tags:', error);
      return [];
    }
  }

  // Get tags for a specific article
  async getArticleTags(articleUrl: string): Promise<Tag[]> {
    try {
      const articleTags = await this.getAllArticleTags();
      const articleTag = articleTags.find(at => at.articleUrl === articleUrl);
      
      if (!articleTag || articleTag.tagIds.length === 0) {
        return [];
      }

      const allTags = await this.getTags();
      return allTags.filter(tag => articleTag.tagIds.includes(tag.id));
    } catch (error) {
      console.error('Error getting article tags:', error);
      return [];
    }
  }

  // Add tags to an article
  async addTagsToArticle(articleUrl: string, tagIds: string[]): Promise<void> {
    try {
      const articleTags = await this.getAllArticleTags();
      const existingIndex = articleTags.findIndex(at => at.articleUrl === articleUrl);

      if (existingIndex !== -1) {
        // Add new tags to existing
        const existingTagIds = articleTags[existingIndex].tagIds;
        const uniqueTagIds = Array.from(new Set([...existingTagIds, ...tagIds]));
        articleTags[existingIndex].tagIds = uniqueTagIds;
      } else {
        // Create new article tag entry
        articleTags.push({
          articleUrl,
          tagIds,
        });
      }

      await AsyncStorage.setItem(ARTICLE_TAGS_STORAGE_KEY, JSON.stringify(articleTags));
    } catch (error) {
      console.error('Error adding tags to article:', error);
      throw error;
    }
  }

  // Remove tag from an article
  async removeTagFromArticle(articleUrl: string, tagId: string): Promise<void> {
    try {
      const articleTags = await this.getAllArticleTags();
      const articleTag = articleTags.find(at => at.articleUrl === articleUrl);

      if (articleTag) {
        articleTag.tagIds = articleTag.tagIds.filter(id => id !== tagId);
        await AsyncStorage.setItem(ARTICLE_TAGS_STORAGE_KEY, JSON.stringify(articleTags));
      }
    } catch (error) {
      console.error('Error removing tag from article:', error);
      throw error;
    }
  }

  // Set tags for an article (replaces all existing tags)
  async setArticleTags(articleUrl: string, tagIds: string[]): Promise<void> {
    try {
      const articleTags = await this.getAllArticleTags();
      const existingIndex = articleTags.findIndex(at => at.articleUrl === articleUrl);

      if (existingIndex !== -1) {
        articleTags[existingIndex].tagIds = tagIds;
      } else {
        articleTags.push({
          articleUrl,
          tagIds,
        });
      }

      await AsyncStorage.setItem(ARTICLE_TAGS_STORAGE_KEY, JSON.stringify(articleTags));
    } catch (error) {
      console.error('Error setting article tags:', error);
      throw error;
    }
  }

  /**
   * ========== COLLECTIONS MANAGEMENT ==========
   */

  // Get all collections
  async getCollections(): Promise<Collection[]> {
    try {
      const data = await AsyncStorage.getItem(COLLECTIONS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  // Create a new collection
  async createCollection(
    name: string,
    description: string = '',
    icon: string = 'folder',
    color: string = TAG_COLORS[0]
  ): Promise<Collection> {
    try {
      const collections = await this.getCollections();
      
      // Check if collection with same name exists
      const existing = collections.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        throw new Error('Collection with this name already exists');
      }

      const newCollection: Collection = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        articleUrls: [],
        isSmartCollection: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      collections.push(newCollection);
      await AsyncStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
      return newCollection;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  // Create a smart collection
  async createSmartCollection(
    name: string,
    filterType: 'category' | 'source' | 'tag',
    filterValue: string,
    icon: string = 'planet',
    color: string = TAG_COLORS[0]
  ): Promise<Collection> {
    try {
      const collections = await this.getCollections();

      const newCollection: Collection = {
        id: Date.now().toString(),
        name: name.trim(),
        description: `Auto-organized by ${filterType}`,
        icon,
        color,
        articleUrls: [],
        isSmartCollection: true,
        smartFilter: {
          type: filterType,
          value: filterValue,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      collections.push(newCollection);
      await AsyncStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
      return newCollection;
    } catch (error) {
      console.error('Error creating smart collection:', error);
      throw error;
    }
  }

  // Update a collection
  async updateCollection(collectionId: string, updates: Partial<Collection>): Promise<void> {
    try {
      const collections = await this.getCollections();
      const index = collections.findIndex(c => c.id === collectionId);
      
      if (index === -1) {
        throw new Error('Collection not found');
      }

      collections[index] = {
        ...collections[index],
        ...updates,
        updatedAt: Date.now(),
      };
      
      await AsyncStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  // Delete a collection
  async deleteCollection(collectionId: string): Promise<void> {
    try {
      const collections = await this.getCollections();
      const filtered = collections.filter(c => c.id !== collectionId);
      await AsyncStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  // Add article to collection
  async addArticleToCollection(collectionId: string, articleUrl: string): Promise<void> {
    try {
      const collections = await this.getCollections();
      const collection = collections.find(c => c.id === collectionId);

      if (!collection) {
        throw new Error('Collection not found');
      }

      if (collection.isSmartCollection) {
        throw new Error('Cannot manually add articles to smart collections');
      }

      if (!collection.articleUrls.includes(articleUrl)) {
        collection.articleUrls.push(articleUrl);
        collection.updatedAt = Date.now();
        await AsyncStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
      }
    } catch (error) {
      console.error('Error adding article to collection:', error);
      throw error;
    }
  }

  // Remove article from collection
  async removeArticleFromCollection(collectionId: string, articleUrl: string): Promise<void> {
    try {
      const collections = await this.getCollections();
      const collection = collections.find(c => c.id === collectionId);

      if (!collection) {
        throw new Error('Collection not found');
      }

      if (collection.isSmartCollection) {
        throw new Error('Cannot manually remove articles from smart collections');
      }

      collection.articleUrls = collection.articleUrls.filter(url => url !== articleUrl);
      collection.updatedAt = Date.now();
      await AsyncStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
    } catch (error) {
      console.error('Error removing article from collection:', error);
      throw error;
    }
  }

  // Get collections containing an article
  async getCollectionsForArticle(articleUrl: string): Promise<Collection[]> {
    try {
      const collections = await this.getCollections();
      return collections.filter(c => c.articleUrls.includes(articleUrl));
    } catch (error) {
      console.error('Error getting collections for article:', error);
      return [];
    }
  }

  // Get articles with specific tag
  async getArticlesWithTag(tagId: string): Promise<string[]> {
    try {
      const articleTags = await this.getAllArticleTags();
      return articleTags
        .filter(at => at.tagIds.includes(tagId))
        .map(at => at.articleUrl);
    } catch (error) {
      console.error('Error getting articles with tag:', error);
      return [];
    }
  }

  // Get tag usage count
  async getTagUsageCount(tagId: string): Promise<number> {
    try {
      const articles = await this.getArticlesWithTag(tagId);
      return articles.length;
    } catch (error) {
      console.error('Error getting tag usage count:', error);
      return 0;
    }
  }

  /**
   * ========== UTILITY METHODS ==========
   */

  // Clear all tags
  async clearAllTags(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TAGS_STORAGE_KEY);
      await AsyncStorage.removeItem(ARTICLE_TAGS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing tags:', error);
      throw error;
    }
  }

  // Clear all collections
  async clearAllCollections(): Promise<void> {
    try {
      await AsyncStorage.removeItem(COLLECTIONS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing collections:', error);
      throw error;
    }
  }

  // Get statistics
  async getStatistics(): Promise<{
    totalTags: number;
    totalCollections: number;
    totalTaggedArticles: number;
    totalSmartCollections: number;
  }> {
    try {
      const tags = await this.getTags();
      const collections = await this.getCollections();
      const articleTags = await this.getAllArticleTags();

      return {
        totalTags: tags.length,
        totalCollections: collections.length,
        totalTaggedArticles: articleTags.filter(at => at.tagIds.length > 0).length,
        totalSmartCollections: collections.filter(c => c.isSmartCollection).length,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalTags: 0,
        totalCollections: 0,
        totalTaggedArticles: 0,
        totalSmartCollections: 0,
      };
    }
  }
}

export const tagsService = new TagsService();

