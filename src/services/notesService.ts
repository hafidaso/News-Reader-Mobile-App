import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article } from '../types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const NOTES_STORAGE_KEY = '@notes';
const HIGHLIGHTS_STORAGE_KEY = '@highlights';

export interface Note {
  id: string;
  articleUrl: string;
  articleTitle: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Highlight {
  id: string;
  articleUrl: string;
  articleTitle: string;
  text: string;
  color: string;
  note?: string;
  createdAt: number;
}

// Highlight colors
export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FFF176', light: '#FFF9C4' },
  { name: 'Green', value: '#81C784', light: '#C8E6C9' },
  { name: 'Blue', value: '#64B5F6', light: '#BBDEFB' },
  { name: 'Pink', value: '#F06292', light: '#F8BBD0' },
  { name: 'Orange', value: '#FFB74D', light: '#FFE0B2' },
  { name: 'Purple', value: '#BA68C8', light: '#E1BEE7' },
];

class NotesService {
  /**
   * ========== NOTES MANAGEMENT ==========
   */

  // Get all notes
  async getNotes(): Promise<Note[]> {
    try {
      const data = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  // Get notes for specific article
  async getNotesForArticle(articleUrl: string): Promise<Note[]> {
    try {
      const allNotes = await this.getNotes();
      return allNotes.filter(note => note.articleUrl === articleUrl);
    } catch (error) {
      console.error('Error getting notes for article:', error);
      return [];
    }
  }

  // Create a new note
  async createNote(
    articleUrl: string,
    articleTitle: string,
    content: string
  ): Promise<Note> {
    try {
      const notes = await this.getNotes();
      
      const newNote: Note = {
        id: Date.now().toString(),
        articleUrl,
        articleTitle,
        content: content.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      notes.unshift(newNote);
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  // Update a note
  async updateNote(noteId: string, content: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const index = notes.findIndex(n => n.id === noteId);
      
      if (index === -1) {
        throw new Error('Note not found');
      }

      notes[index].content = content.trim();
      notes[index].updatedAt = Date.now();
      
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  // Delete a note
  async deleteNote(noteId: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const filtered = notes.filter(n => n.id !== noteId);
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // Search notes
  async searchNotes(query: string): Promise<Note[]> {
    try {
      const allNotes = await this.getNotes();
      const lowerQuery = query.toLowerCase();
      
      return allNotes.filter(note =>
        note.content.toLowerCase().includes(lowerQuery) ||
        note.articleTitle.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }

  /**
   * ========== HIGHLIGHTS MANAGEMENT ==========
   */

  // Get all highlights
  async getHighlights(): Promise<Highlight[]> {
    try {
      const data = await AsyncStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting highlights:', error);
      return [];
    }
  }

  // Get highlights for specific article
  async getHighlightsForArticle(articleUrl: string): Promise<Highlight[]> {
    try {
      const allHighlights = await this.getHighlights();
      return allHighlights.filter(h => h.articleUrl === articleUrl);
    } catch (error) {
      console.error('Error getting highlights for article:', error);
      return [];
    }
  }

  // Create a new highlight
  async createHighlight(
    articleUrl: string,
    articleTitle: string,
    text: string,
    color: string = HIGHLIGHT_COLORS[0].value,
    note?: string
  ): Promise<Highlight> {
    try {
      const highlights = await this.getHighlights();
      
      const newHighlight: Highlight = {
        id: Date.now().toString(),
        articleUrl,
        articleTitle,
        text: text.trim(),
        color,
        note: note?.trim(),
        createdAt: Date.now(),
      };

      highlights.unshift(newHighlight);
      await AsyncStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
      return newHighlight;
    } catch (error) {
      console.error('Error creating highlight:', error);
      throw error;
    }
  }

  // Update a highlight
  async updateHighlight(
    highlightId: string,
    updates: { text?: string; color?: string; note?: string }
  ): Promise<void> {
    try {
      const highlights = await this.getHighlights();
      const index = highlights.findIndex(h => h.id === highlightId);
      
      if (index === -1) {
        throw new Error('Highlight not found');
      }

      if (updates.text) highlights[index].text = updates.text.trim();
      if (updates.color) highlights[index].color = updates.color;
      if (updates.note !== undefined) highlights[index].note = updates.note?.trim();
      
      await AsyncStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
    } catch (error) {
      console.error('Error updating highlight:', error);
      throw error;
    }
  }

  // Delete a highlight
  async deleteHighlight(highlightId: string): Promise<void> {
    try {
      const highlights = await this.getHighlights();
      const filtered = highlights.filter(h => h.id !== highlightId);
      await AsyncStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }
  }

  // Search highlights
  async searchHighlights(query: string): Promise<Highlight[]> {
    try {
      const allHighlights = await this.getHighlights();
      const lowerQuery = query.toLowerCase();
      
      return allHighlights.filter(highlight =>
        highlight.text.toLowerCase().includes(lowerQuery) ||
        highlight.note?.toLowerCase().includes(lowerQuery) ||
        highlight.articleTitle.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching highlights:', error);
      return [];
    }
  }

  /**
   * ========== EXPORT FUNCTIONALITY ==========
   */

  // Export notes and highlights as Markdown
  async exportAsMarkdown(articleUrl?: string): Promise<string> {
    try {
      const notes = articleUrl 
        ? await this.getNotesForArticle(articleUrl)
        : await this.getNotes();
      
      const highlights = articleUrl
        ? await this.getHighlightsForArticle(articleUrl)
        : await this.getHighlights();

      let markdown = '# My Notes & Highlights\n\n';
      markdown += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
      markdown += '---\n\n';

      // Group by article
      const articleMap = new Map<string, { notes: Note[]; highlights: Highlight[] }>();

      notes.forEach(note => {
        if (!articleMap.has(note.articleUrl)) {
          articleMap.set(note.articleUrl, { notes: [], highlights: [] });
        }
        articleMap.get(note.articleUrl)!.notes.push(note);
      });

      highlights.forEach(highlight => {
        if (!articleMap.has(highlight.articleUrl)) {
          articleMap.set(highlight.articleUrl, { notes: [], highlights: [] });
        }
        articleMap.get(highlight.articleUrl)!.highlights.push(highlight);
      });

      // Generate markdown for each article
      articleMap.forEach((data, url) => {
        const articleTitle = data.notes[0]?.articleTitle || data.highlights[0]?.articleTitle || 'Unknown Article';
        
        markdown += `## ${articleTitle}\n\n`;
        markdown += `Source: ${url}\n\n`;

        if (data.highlights.length > 0) {
          markdown += '### Highlights\n\n';
          data.highlights.forEach((highlight, index) => {
            markdown += `${index + 1}. > ${highlight.text}\n\n`;
            if (highlight.note) {
              markdown += `   *Note: ${highlight.note}*\n\n`;
            }
          });
        }

        if (data.notes.length > 0) {
          markdown += '### Notes\n\n';
          data.notes.forEach((note, index) => {
            const date = new Date(note.createdAt).toLocaleDateString();
            markdown += `**${index + 1}. ${date}**\n\n`;
            markdown += `${note.content}\n\n`;
          });
        }

        markdown += '---\n\n';
      });

      return markdown;
    } catch (error) {
      console.error('Error exporting as markdown:', error);
      throw error;
    }
  }

  // Save markdown to file and share
  async shareAsMarkdown(articleUrl?: string): Promise<void> {
    try {
      const markdown = await this.exportAsMarkdown(articleUrl);
      const fileName = articleUrl 
        ? `article-notes-${Date.now()}.md`
        : `all-notes-${Date.now()}.md`;
      
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, markdown, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/markdown',
          dialogTitle: 'Export Notes',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing markdown:', error);
      throw error;
    }
  }

  // Export as plain text
  async exportAsText(articleUrl?: string): Promise<string> {
    try {
      const notes = articleUrl 
        ? await this.getNotesForArticle(articleUrl)
        : await this.getNotes();
      
      const highlights = articleUrl
        ? await this.getHighlightsForArticle(articleUrl)
        : await this.getHighlights();

      let text = 'MY NOTES & HIGHLIGHTS\n';
      text += '='.repeat(50) + '\n\n';
      text += `Generated on: ${new Date().toLocaleString()}\n\n`;

      // Group by article
      const articleMap = new Map<string, { notes: Note[]; highlights: Highlight[] }>();

      notes.forEach(note => {
        if (!articleMap.has(note.articleUrl)) {
          articleMap.set(note.articleUrl, { notes: [], highlights: [] });
        }
        articleMap.get(note.articleUrl)!.notes.push(note);
      });

      highlights.forEach(highlight => {
        if (!articleMap.has(highlight.articleUrl)) {
          articleMap.set(highlight.articleUrl, { notes: [], highlights: [] });
        }
        articleMap.get(highlight.articleUrl)!.highlights.push(highlight);
      });

      // Generate text for each article
      articleMap.forEach((data, url) => {
        const articleTitle = data.notes[0]?.articleTitle || data.highlights[0]?.articleTitle || 'Unknown Article';
        
        text += '\n' + '='.repeat(50) + '\n';
        text += articleTitle + '\n';
        text += '='.repeat(50) + '\n';
        text += `Source: ${url}\n\n`;

        if (data.highlights.length > 0) {
          text += 'HIGHLIGHTS:\n' + '-'.repeat(30) + '\n\n';
          data.highlights.forEach((highlight, index) => {
            text += `${index + 1}. ${highlight.text}\n`;
            if (highlight.note) {
              text += `   Note: ${highlight.note}\n`;
            }
            text += '\n';
          });
        }

        if (data.notes.length > 0) {
          text += 'NOTES:\n' + '-'.repeat(30) + '\n\n';
          data.notes.forEach((note, index) => {
            const date = new Date(note.createdAt).toLocaleDateString();
            text += `${index + 1}. [${date}]\n`;
            text += `${note.content}\n\n`;
          });
        }
      });

      return text;
    } catch (error) {
      console.error('Error exporting as text:', error);
      throw error;
    }
  }

  /**
   * ========== UTILITY METHODS ==========
   */

  // Get statistics
  async getStatistics(): Promise<{
    totalNotes: number;
    totalHighlights: number;
    articlesWithNotes: number;
    articlesWithHighlights: number;
  }> {
    try {
      const notes = await this.getNotes();
      const highlights = await this.getHighlights();

      const uniqueArticlesWithNotes = new Set(notes.map(n => n.articleUrl));
      const uniqueArticlesWithHighlights = new Set(highlights.map(h => h.articleUrl));

      return {
        totalNotes: notes.length,
        totalHighlights: highlights.length,
        articlesWithNotes: uniqueArticlesWithNotes.size,
        articlesWithHighlights: uniqueArticlesWithHighlights.size,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalNotes: 0,
        totalHighlights: 0,
        articlesWithNotes: 0,
        articlesWithHighlights: 0,
      };
    }
  }

  // Clear all notes
  async clearAllNotes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notes:', error);
      throw error;
    }
  }

  // Clear all highlights
  async clearAllHighlights(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HIGHLIGHTS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing highlights:', error);
      throw error;
    }
  }

  // Get combined count for article
  async getArticleAnnotationCount(articleUrl: string): Promise<number> {
    const notes = await this.getNotesForArticle(articleUrl);
    const highlights = await this.getHighlightsForArticle(articleUrl);
    return notes.length + highlights.length;
  }
}

export const notesService = new NotesService();

