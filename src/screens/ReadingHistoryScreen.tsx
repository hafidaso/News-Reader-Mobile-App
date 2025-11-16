import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { readingHistoryService, ReadingHistoryItem } from '../services/readingHistoryService';
import { LoadingState } from '../components';

interface ReadingHistoryScreenProps {
  navigation: any;
}

export const ReadingHistoryScreen: React.FC<ReadingHistoryScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const historyData = await readingHistoryService.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Reading History',
      `This will permanently delete all ${history.length} articles from your reading history. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await readingHistoryService.clearHistory();
            setHistory([]);
            Alert.alert('Success', 'Reading history cleared');
          },
        },
      ]
    );
  };

  const handleRemoveItem = (articleUrl: string, articleTitle: string) => {
    Alert.alert(
      'Remove from History',
      `Remove "${articleTitle}" from your reading history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await readingHistoryService.removeFromHistory(articleUrl);
            setHistory(prev => prev.filter(item => item.article.url !== articleUrl));
          },
        },
      ]
    );
  };

  const handleArticlePress = (item: ReadingHistoryItem) => {
    navigation.navigate('ArticleDetail', {
      article: item.article,
      fromHistory: true,
    });
  };

  const formatReadingTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderHistoryItem = ({ item }: { item: ReadingHistoryItem }) => {
    const { article, readAt, readingTime, category } = item;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card }]}
        onPress={() => handleArticlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Image */}
          {article.urlToImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: article.urlToImage }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Content */}
          <View style={styles.textContent}>
            <Text
              style={[styles.title, { color: theme.text }]}
              numberOfLines={2}
            >
              {article.title}
            </Text>

            {article.description && (
              <Text
                style={[styles.description, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {article.description}
              </Text>
            )}

            {/* Meta Info */}
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {formatRelativeTime(readAt)}
                </Text>

                {readingTime > 0 && (
                  <>
                    <Text style={[styles.metaDivider, { color: theme.textSecondary }]}>•</Text>
                    <Ionicons name="book-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {formatReadingTime(readingTime)}
                    </Text>
                  </>
                )}

                <Text style={[styles.metaDivider, { color: theme.textSecondary }]}>•</Text>
                <Text style={[styles.categoryBadge, { color: theme.primary, backgroundColor: theme.primary + '20' }]}>
                  {category}
                </Text>
              </View>
            </View>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => handleRemoveItem(article.url, article.title)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={24} color={theme.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>📚 Reading History</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {history.length} {history.length === 1 ? 'article' : 'articles'} read
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Analytics')}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart" size={24} color={theme.primary} />
          </TouchableOpacity>

          {history.length > 0 && (
            <TouchableOpacity
              onPress={handleClearHistory}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={24} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="book-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Reading History
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
            Articles you read will appear here. Start exploring news to build your reading history!
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.article.url + item.readAt}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
        />
      )}
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
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
  },
  textContent: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  metaContainer: {
    marginTop: 'auto',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  metaDivider: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

