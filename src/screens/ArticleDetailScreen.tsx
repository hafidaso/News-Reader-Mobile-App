import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../types';
import { navigationHistory } from '../services/navigationHistory';
import { bookmarkStorage } from '../services/bookmarkStorage';
import { shareService } from '../services/shareService';
import { readingHistoryService } from '../services/readingHistoryService';
import { tagsService, Tag } from '../services/tagsService';
import { notesService } from '../services/notesService';
import { summaryService, ArticleSummary } from '../services/summaryService';
import { useTheme } from '../contexts/ThemeContext';
import { TagSelector, CollectionSelector, TagChip, AnnotationButton, SummaryCard } from '../components';

interface ArticleDetailScreenProps {
  route: any;
  navigation: any;
}

export const ArticleDetailScreen: React.FC<ArticleDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { theme, isDark } = useTheme();
  const { article: initialArticle, bookmarksList, currentIndex: initialIndex, fromBookmarks, category } = route.params;
  const [currentArticle, setCurrentArticle] = useState<Article>(initialArticle);
  const [loading, setLoading] = useState<boolean>(true);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [articleTags, setArticleTags] = useState<Tag[]>([]);
  const [annotationCount, setAnnotationCount] = useState(0);
  const [showAnnotationMenu, setShowAnnotationMenu] = useState(false);
  const [summary, setSummary] = useState<ArticleSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const webViewRef = useRef<WebView>(null);
  
  // For bookmark navigation
  const [currentBookmarkIndex, setCurrentBookmarkIndex] = useState<number>(initialIndex || -1);
  const bookmarksArray = bookmarksList || [];
  
  // Reading time tracking
  const startTimeRef = useRef<number>(Date.now());
  const currentArticleUrlRef = useRef<string>(initialArticle.url);

  // Add initial article to history and reading history
  useEffect(() => {
    if (!fromBookmarks) {
      navigationHistory.addToHistory(initialArticle);
      updateNavigationButtons();
    }
    checkBookmarkStatus(initialArticle.url);
    loadArticleTags();
    loadAnnotationCount();
    loadSummary();
    
    // Start reading time tracking
    startTimeRef.current = Date.now();
    currentArticleUrlRef.current = initialArticle.url;
    
    // Cleanup: Save reading time when leaving the screen
    return () => {
      saveReadingHistory();
    };
  }, []);
  
  // Track article changes
  useEffect(() => {
    if (currentArticle.url !== currentArticleUrlRef.current) {
      // Save previous article's reading time
      saveReadingHistory();
      
      // Start tracking new article
      startTimeRef.current = Date.now();
      currentArticleUrlRef.current = currentArticle.url;
    }
  }, [currentArticle]);
  
  // Save reading history
  const saveReadingHistory = async () => {
    const readingTime = Math.floor((Date.now() - startTimeRef.current) / 1000); // in seconds
    const articleCategory = category || 'general';
    
    // Only save if user spent at least 5 seconds reading
    if (readingTime >= 5) {
      await readingHistoryService.addToHistory(
        {
          title: currentArticle.title,
          description: currentArticle.description,
          url: currentArticleUrlRef.current,
          urlToImage: currentArticle.urlToImage,
          publishedAt: currentArticle.publishedAt,
          source: currentArticle.source,
          author: currentArticle.author,
          content: currentArticle.content,
        },
        readingTime,
        articleCategory
      );
    }
  };

  // Check if article is bookmarked
  const checkBookmarkStatus = async (url: string) => {
    const bookmarked = await bookmarkStorage.isBookmarked(url);
    setIsBookmarked(bookmarked);
  };

  // Load article tags
  const loadArticleTags = async () => {
    const tags = await tagsService.getArticleTags(currentArticle.url);
    setArticleTags(tags);
  };

  // Load annotation count (notes + highlights)
  const loadAnnotationCount = async () => {
    const count = await notesService.getArticleAnnotationCount(currentArticle.url);
    setAnnotationCount(count);
  };

  // Load summary
  const loadSummary = async () => {
    const cached = await summaryService.getSummary(currentArticle.url);
    if (cached) {
      setSummary(cached);
    }
  };

  // Generate AI summary
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const newSummary = await summaryService.getOrGenerateSummary(currentArticle, true);
      setSummary(newSummary);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handle tags selected
  const handleTagsSelected = async (tagIds: string[]) => {
    await tagsService.setArticleTags(currentArticle.url, tagIds);
    loadArticleTags();
  };

  // Handle annotation actions
  const handleAddNote = () => {
    setShowAnnotationMenu(false);
    navigation.navigate('NoteEditor' as never, {
      articleUrl: currentArticle.url,
      articleTitle: currentArticle.title,
    } as never);
  };

  const handleViewAnnotations = () => {
    setShowAnnotationMenu(false);
    navigation.navigate('Notes' as never, {
      articleUrl: currentArticle.url,
      articleTitle: currentArticle.title,
    } as never);
  };

  // Update navigation button states
  const updateNavigationButtons = () => {
    if (fromBookmarks) {
      // For bookmarks, use bookmark array navigation
      setCanGoBack(currentBookmarkIndex > 0);
      setCanGoForward(currentBookmarkIndex < bookmarksArray.length - 1);
    } else {
      // For regular navigation, use history service
      setCanGoBack(navigationHistory.canGoBack());
      setCanGoForward(navigationHistory.canGoForward());
    }
  };

  // Handle back button
  const handleGoBack = () => {
    if (fromBookmarks && currentBookmarkIndex > 0) {
      // Navigate through bookmarks
      const newIndex = currentBookmarkIndex - 1;
      const previousArticle = bookmarksArray[newIndex];
      setCurrentBookmarkIndex(newIndex);
      setCurrentArticle(previousArticle);
      checkBookmarkStatus(previousArticle.url);
      updateNavigationButtons();
    } else {
      // Use history navigation
      const previousArticle = navigationHistory.goBack();
      if (previousArticle) {
        setCurrentArticle(previousArticle);
        updateNavigationButtons();
        checkBookmarkStatus(previousArticle.url);
      }
    }
  };

  // Handle forward button
  const handleGoForward = () => {
    if (fromBookmarks && currentBookmarkIndex < bookmarksArray.length - 1) {
      // Navigate through bookmarks
      const newIndex = currentBookmarkIndex + 1;
      const nextArticle = bookmarksArray[newIndex];
      setCurrentBookmarkIndex(newIndex);
      setCurrentArticle(nextArticle);
      checkBookmarkStatus(nextArticle.url);
      updateNavigationButtons();
    } else {
      // Use history navigation
      const nextArticle = navigationHistory.goForward();
      if (nextArticle) {
        setCurrentArticle(nextArticle);
        updateNavigationButtons();
        checkBookmarkStatus(nextArticle.url);
      }
    }
  };

  // Update navigation buttons when bookmark index changes
  useEffect(() => {
    updateNavigationButtons();
  }, [currentBookmarkIndex]);

  // Handle close
  const handleClose = () => {
    navigationHistory.clearHistory();
    navigation.goBack();
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) {
        await bookmarkStorage.removeBookmark(currentArticle.url);
        setIsBookmarked(false);
      } else {
        await bookmarkStorage.addBookmark(currentArticle);
        setIsBookmarked(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  // Handle share
  const handleShare = async () => {
    await shareService.shareArticle(currentArticle);
  };

  // Handle WebView back/forward
  const handleWebViewGoBack = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const handleWebViewGoForward = () => {
    if (webViewRef.current) {
      webViewRef.current.goForward();
    }
  };

  // Get position based on navigation mode
  const getPosition = () => {
    if (fromBookmarks) {
      return {
        current: currentBookmarkIndex + 1,
        total: bookmarksArray.length,
      };
    }
    return navigationHistory.getCurrentPosition();
  };

  const position = getPosition();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {currentArticle.source.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {fromBookmarks ? `Bookmark ${position.current} of ${position.total}` : `Article ${position.current} of ${position.total}`}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowSummary(!showSummary)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showSummary ? 'document-text' : 'document-text-outline'}
              size={22}
              color={showSummary ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowTagSelector(true)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pricetag"
              size={22}
              color={articleTags.length > 0 ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCollectionSelector(true)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="folder"
              size={22}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="share-outline"
              size={22}
              color={theme.text}
            />
          </TouchableOpacity>
        <TouchableOpacity
          onPress={handleBookmarkToggle}
            style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? theme.primary : theme.textSecondary}
          />
        </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Controls */}
      <View style={[styles.controls, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View style={styles.controlsLeft}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={[
              styles.navButton,
              { 
                backgroundColor: theme.surface, 
                borderColor: canGoBack ? theme.primary : theme.border 
              },
              !canGoBack && styles.navButtonDisabled
            ]}
            activeOpacity={0.7}
            disabled={!canGoBack}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={canGoBack ? theme.primary : theme.border}
            />
            <Text style={[
              styles.navButtonText, 
              { color: canGoBack ? theme.primary : theme.border }
            ]}>
              Previous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGoForward}
            style={[
              styles.navButton,
              { 
                backgroundColor: theme.surface, 
                borderColor: canGoForward ? theme.primary : theme.border 
              },
              !canGoForward && styles.navButtonDisabled
            ]}
            activeOpacity={0.7}
            disabled={!canGoForward}
          >
            <Text style={[
              styles.navButtonText, 
              { color: canGoForward ? theme.primary : theme.border }
            ]}>
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={canGoForward ? theme.primary : theme.border}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.controlsRight}>
          <TouchableOpacity
            onPress={handleWebViewGoBack}
            style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWebViewGoForward}
            style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tags Bar */}
      {articleTags.length > 0 && (
        <View style={[styles.tagsBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          {articleTags.map(tag => (
            <TagChip
              key={tag.id}
              name={tag.name}
              color={tag.color}
              small
              onPress={() => setShowTagSelector(true)}
            />
          ))}
        </View>
      )}

      {/* Summary Section */}
      {showSummary && (
        <View style={[styles.summaryContainer, { backgroundColor: theme.background }]}>
          <SummaryCard
            summary={summary}
            loading={summaryLoading}
            onGenerate={handleGenerateSummary}
            showReadingTime={true}
          />
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentArticle.url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loadingContainer, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading article...</Text>
          </View>
        )}
      />

      {/* Floating Annotation Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.primary }]}
        onPress={() => setShowAnnotationMenu(!showAnnotationMenu)}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={28} color="#FFFFFF" />
        {annotationCount > 0 && (
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>
              {annotationCount > 9 ? '9+' : annotationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Annotation Menu */}
      {showAnnotationMenu && (
        <View style={[styles.annotationMenu, { backgroundColor: theme.card }]}>
          <View style={styles.menuButtonsContainer}>
            <AnnotationButton
              icon="document-text"
              label="Add Note"
              onPress={handleAddNote}
            />
            {annotationCount > 0 && (
              <AnnotationButton
                icon="eye"
                label="View All"
                count={annotationCount}
                onPress={handleViewAnnotations}
                color={theme.success || theme.primary}
              />
            )}
          </View>
        </View>
      )}

      {/* Tag Selector Modal */}
      <TagSelector
        visible={showTagSelector}
        onClose={() => setShowTagSelector(false)}
        selectedTagIds={articleTags.map(t => t.id)}
        onTagsSelected={handleTagsSelected}
      />

      {/* Collection Selector Modal */}
      <CollectionSelector
        visible={showCollectionSelector}
        onClose={() => setShowCollectionSelector(false)}
        articleUrl={currentArticle.url}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  controlsLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  controlsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  summaryContainer: {
    padding: 16,
    paddingTop: 8,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  floatingBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  floatingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  annotationMenu: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    left: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});

