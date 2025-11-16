import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  ArticleCard,
  LoadingState,
  EmptyState,
} from '../components';
import { Article } from '../types';
import { bookmarkStorage } from '../services/bookmarkStorage';
import { useTheme } from '../contexts/ThemeContext';

interface BookmarksScreenProps {
  navigation: any;
}

export const BookmarksScreen: React.FC<BookmarksScreenProps> = ({ navigation }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookmarkedUrls, setBookmarkedUrls] = useState<Set<string>>(new Set());

  // Load bookmarks when screen is focused
  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const savedBookmarks = await bookmarkStorage.getBookmarks();
      setBookmarks(savedBookmarks);
      
      // Create a set of bookmarked URLs for quick lookup
      const urls = new Set(savedBookmarks.map(article => article.url));
      setBookmarkedUrls(urls);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload bookmarks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  // Handle removing a bookmark
  const handleRemoveBookmark = async (articleUrl: string) => {
    try {
      await bookmarkStorage.removeBookmark(articleUrl);
      await loadBookmarks(); // Reload the list
    } catch (error) {
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  // Handle article press - navigate to detail screen with all bookmarks for navigation
  const handleArticlePress = (article: Article) => {
    const articleIndex = bookmarks.findIndex(b => b.url === article.url);
    navigation.navigate('ArticleDetail', { 
      article,
      bookmarksList: bookmarks,
      currentIndex: articleIndex,
      fromBookmarks: true,
    });
  };

  // Handle clearing all bookmarks
  const handleClearAll = () => {
    Alert.alert(
      'Clear All Bookmarks',
      'Are you sure you want to remove all bookmarks? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookmarkStorage.clearAllBookmarks();
              setBookmarks([]);
              setBookmarkedUrls(new Set());
            } catch (error) {
              Alert.alert('Error', 'Failed to clear bookmarks');
            }
          },
        },
      ]
    );
  };

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (bookmarks.length === 0) {
      return (
        <EmptyState message="No bookmarks yet. Start saving your favorite articles!" />
      );
    }

    return (
      <FlatList
        data={bookmarks}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            isBookmarked={true}
            onBookmarkToggle={() => handleRemoveBookmark(item.url)}
            onPress={() => handleArticlePress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface} />
      
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
            <Text style={[styles.headerTitle, { color: theme.text }]}>🔖 Bookmarks</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.themeButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isDark ? 'sunny' : 'moon'} 
                size={20} 
                color={theme.text} 
              />
            </TouchableOpacity>
            {bookmarks.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                style={[styles.clearButton, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color={theme.error} />
                <Text style={[styles.clearButtonText, { color: theme.error }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {bookmarks.length === 0
            ? 'Your saved articles will appear here'
            : `${bookmarks.length} saved article${bookmarks.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    padding: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
});

