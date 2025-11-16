import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { notesService, Note, Highlight, HIGHLIGHT_COLORS } from '../services/notesService';
import { NoteCard, HighlightCard } from '../components';

type TabType = 'all' | 'notes' | 'highlights';

export const NotesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { articleUrl?: string; articleTitle?: string } | undefined;

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const articleUrl = params?.articleUrl;
  const articleTitle = params?.articleTitle;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [articleUrl])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedNotes, loadedHighlights] = await Promise.all([
        articleUrl 
          ? notesService.getNotesForArticle(articleUrl)
          : notesService.getNotes(),
        articleUrl
          ? notesService.getHighlightsForArticle(articleUrl)
          : notesService.getHighlights(),
      ]);
      setNotes(loadedNotes);
      setHighlights(loadedHighlights);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes and highlights');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const [searchedNotes, searchedHighlights] = await Promise.all([
        notesService.searchNotes(searchQuery),
        notesService.searchHighlights(searchQuery),
      ]);
      setNotes(searchedNotes);
      setHighlights(searchedHighlights);
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Error', 'Failed to search notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notesService.deleteNote(noteId);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleDeleteHighlight = (highlightId: string) => {
    Alert.alert(
      'Delete Highlight',
      'Are you sure you want to delete this highlight?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notesService.deleteHighlight(highlightId);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete highlight');
            }
          },
        },
      ]
    );
  };

  const handleExport = async (format: 'markdown' | 'text') => {
    setExporting(true);
    try {
      if (format === 'markdown') {
        await notesService.shareAsMarkdown(articleUrl);
      } else {
        const text = await notesService.exportAsText(articleUrl);
        // For text, we can use share or save
        await notesService.shareAsMarkdown(articleUrl); // Will handle text export
      }
      setShowExportModal(false);
      Alert.alert('Success', 'Notes exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export notes. Make sure you have notes to export.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All',
      `Are you sure you want to delete all ${activeTab === 'notes' ? 'notes' : activeTab === 'highlights' ? 'highlights' : 'notes and highlights'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeTab === 'notes' || activeTab === 'all') {
                await notesService.clearAllNotes();
              }
              if (activeTab === 'highlights' || activeTab === 'all') {
                await notesService.clearAllHighlights();
              }
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const getFilteredData = () => {
    const combined: Array<{ type: 'note' | 'highlight'; data: Note | Highlight }> = [];

    if (activeTab === 'all' || activeTab === 'notes') {
      notes.forEach(note => combined.push({ type: 'note', data: note }));
    }
    if (activeTab === 'all' || activeTab === 'highlights') {
      highlights.forEach(highlight => combined.push({ type: 'highlight', data: highlight }));
    }

    // Sort by creation date
    return combined.sort((a, b) => {
      const timeA = 'createdAt' in a.data ? a.data.createdAt : 0;
      const timeB = 'createdAt' in b.data ? b.data.createdAt : 0;
      return timeB - timeA;
    });
  };

  const renderItem = ({ item }: { item: { type: 'note' | 'highlight'; data: Note | Highlight } }) => {
    if (item.type === 'note') {
      const note = item.data as Note;
      return (
        <NoteCard
          note={note}
          showArticleTitle={!articleUrl}
          onPress={() => {
            navigation.navigate('ArticleDetail' as never, {
              article: { url: note.articleUrl, title: note.articleTitle },
            } as never);
          }}
          onEdit={() => {
            navigation.navigate('NoteEditor' as never, {
              noteId: note.id,
              articleUrl: note.articleUrl,
              articleTitle: note.articleTitle,
              initialContent: note.content,
            } as never);
          }}
          onDelete={() => handleDeleteNote(note.id)}
        />
      );
    } else {
      const highlight = item.data as Highlight;
      return (
        <HighlightCard
          highlight={highlight}
          showArticleTitle={!articleUrl}
          onPress={() => {
            navigation.navigate('ArticleDetail' as never, {
              article: { url: highlight.articleUrl, title: highlight.articleTitle },
            } as never);
          }}
          onDelete={() => handleDeleteHighlight(highlight.id)}
        />
      );
    }
  };

  const filteredData = getFilteredData();
  const totalCount = notes.length + highlights.length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {articleTitle ? '📝 Article Notes' : '📝 My Notes'}
              </Text>
              {articleTitle && (
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {articleTitle}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={24} color={showSearch ? theme.primary : theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowExportModal(true)}
              style={styles.actionButton}
              activeOpacity={0.7}
              disabled={totalCount === 0}
            >
              <Ionicons 
                name="share-outline" 
                size={24} 
                color={totalCount === 0 ? theme.textSecondary : theme.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.actionButton}
              activeOpacity={0.7}
              disabled={totalCount === 0}
            >
              <Ionicons 
                name="trash-outline" 
                size={24} 
                color={totalCount === 0 ? theme.textSecondary : theme.error} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search notes and highlights..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  loadData();
                }}
              >
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'all' && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'all' ? theme.primary : theme.textSecondary },
              ]}
            >
              All ({totalCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'notes' && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('notes')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'notes' ? theme.primary : theme.textSecondary },
              ]}
            >
              Notes ({notes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'highlights' && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('highlights')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'highlights' ? theme.primary : theme.textSecondary },
              ]}
            >
              Highlights ({highlights.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={searchQuery ? 'search-outline' : 'document-text-outline'}
            size={64}
            color={theme.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {searchQuery ? 'No Results Found' : 'No Notes Yet'}
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start adding notes and highlights to articles'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.type}-${(item.data as any).id}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExportModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Export Notes</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Choose export format
            </Text>

            <TouchableOpacity
              style={[styles.exportOption, { backgroundColor: theme.background }]}
              onPress={() => handleExport('markdown')}
              disabled={exporting}
            >
              <Ionicons name="logo-markdown" size={24} color={theme.primary} />
              <View style={styles.exportTextContainer}>
                <Text style={[styles.exportTitle, { color: theme.text }]}>Markdown</Text>
                <Text style={[styles.exportDescription, { color: theme.textSecondary }]}>
                  Formatted text with headers and lists
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.background }]}
              onPress={() => setShowExportModal(false)}
              disabled={exporting}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>

            {exporting && (
              <View style={styles.exportingOverlay}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.exportingText, { color: theme.text }]}>Exporting...</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 200,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  exportTextContainer: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  exportDescription: {
    fontSize: 13,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exportingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});

