import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import {
  CategoryFilter,
  ArticleCard,
  LoadingState,
  EmptyState,
  ErrorState,
  SearchBar,
  LoadingFooter,
} from '../components';
import { Article, Category } from '../types';
import { newsApi } from '../services/newsApi';
import { bookmarkStorage } from '../services/bookmarkStorage';
import { useTheme } from '../contexts/ThemeContext';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category>('general');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [bookmarkedUrls, setBookmarkedUrls] = useState<Set<string>>(new Set());
  const [isOffline, setIsOffline] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Fetch articles based on selected category
  const fetchArticles = useCallback(async (category: Category, isRefreshing = false, page = 1) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      const response = await newsApi.getTopHeadlines(category, page);
      
      if (page === 1) {
      setArticles(response.articles);
      } else {
        // Append new articles to existing ones
        setArticles(prev => [...prev, ...response.articles]);
      }
      
      setTotalResults(response.totalResults);
      setCurrentPage(page);
      
      // Check if there are more articles to load
      const totalPages = Math.ceil(response.totalResults / 20);
      setHasMore(page < totalPages && response.articles.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
      if (page === 1) {
      setArticles([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Search articles by query
  const searchArticles = useCallback(async (query: string, isRefreshing = false, page = 1) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      const response = await newsApi.searchNews(query, page);
      
      if (page === 1) {
      setArticles(response.articles);
      } else {
        // Append new articles to existing ones
        setArticles(prev => [...prev, ...response.articles]);
      }
      
      setTotalResults(response.totalResults);
      setCurrentPage(page);
      
      // Check if there are more articles to load
      const totalPages = Math.ceil(response.totalResults / 20);
      setHasMore(page < totalPages && response.articles.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search news');
      if (page === 1) {
      setArticles([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Load articles when component mounts or category changes
  useEffect(() => {
    if (!isSearchMode) {
    fetchArticles(selectedCategory);
    }
  }, [selectedCategory, fetchArticles, isSearchMode]);

  // Load bookmarked URLs when component mounts
  useEffect(() => {
    const loadBookmarkedUrls = async () => {
      const bookmarks = await bookmarkStorage.getBookmarks();
      const urls = new Set(bookmarks.map(article => article.url));
      setBookmarkedUrls(urls);
    };
    loadBookmarkedUrls();
  }, []);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setIsSearchMode(false);
    setSearchQuery('');
    setCurrentPage(1);
    setHasMore(true);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearchMode(true);
    setCurrentPage(1);
    setHasMore(true);
    searchArticles(query, false, 1);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setCurrentPage(1);
    setHasMore(true);
    fetchArticles(selectedCategory, false, 1);
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    if (isSearchMode && searchQuery) {
      searchArticles(searchQuery, true, 1);
    } else {
      fetchArticles(selectedCategory, true, 1);
    }
  };

  // Handle retry on error
  const handleRetry = () => {
    setCurrentPage(1);
    setHasMore(true);
    if (isSearchMode && searchQuery) {
      searchArticles(searchQuery, false, 1);
    } else {
      fetchArticles(selectedCategory, false, 1);
    }
  };

  // Handle load more (pagination)
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !error) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      
      if (isSearchMode && searchQuery) {
        searchArticles(searchQuery, false, nextPage);
      } else {
        fetchArticles(selectedCategory, false, nextPage);
      }
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (article: Article) => {
    const isCurrentlyBookmarked = bookmarkedUrls.has(article.url);
    
    try {
      if (isCurrentlyBookmarked) {
        await bookmarkStorage.removeBookmark(article.url);
        setBookmarkedUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(article.url);
          return newSet;
        });
      } else {
        await bookmarkStorage.addBookmark(article);
        setBookmarkedUrls(prev => new Set(prev).add(article.url));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Handle article press - navigate to detail screen
  const handleArticlePress = (article: Article) => {
    navigation.navigate('ArticleDetail', { 
      article,
      category: selectedCategory 
    });
  };

  // Render content based on state
  const renderContent = () => {
    if (loading && !refreshing) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState error={error} onRetry={handleRetry} />;
    }

    if (articles.length === 0) {
      const message = isSearchMode
        ? `No articles found for "${searchQuery}"`
        : 'No articles available in this category';
      return <EmptyState message={message} />;
    }

    return (
      <FlatList
        data={articles}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            isBookmarked={bookmarkedUrls.has(item.url)}
            onBookmarkToggle={() => handleBookmarkToggle(item)}
            onPress={() => handleArticlePress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          <LoadingFooter visible={loadingMore || !hasMore} isEndReached={!hasMore && articles.length > 0} />
        }
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
            <Text style={[styles.headerTitle, { color: theme.text }]}>📰 News Reader</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notes')}
              style={styles.themeButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="create-outline" 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Collections')}
              style={styles.themeButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="folder-outline" 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ReadingHistory')}
              style={styles.themeButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="time-outline" 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.themeButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="settings-outline" 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Bookmarks')}
              style={styles.bookmarkHeaderButton}
              activeOpacity={0.7}
            >
              <Ionicons name="bookmark" size={24} color={theme.primary} />
              {bookmarkedUrls.size > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.error }]}>
                  <Text style={styles.badgeText}>
                    {bookmarkedUrls.size > 99 ? '99+' : bookmarkedUrls.size}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {isSearchMode
            ? `Search results for "${searchQuery}"`
            : 'Stay informed with the latest headlines'}
        </Text>
      </View>

      {/* Offline Indicator */}
      {isOffline && (
        <View style={styles.offlineBar}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.offlineText}>Offline - Showing cached articles</Text>
        </View>
      )}

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        placeholder="Search news..."
      />

      {/* Category Filter */}
      {!isSearchMode && (
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />
      )}

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
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  themeButton: {
    padding: 8,
  },
  bookmarkHeaderButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
});

