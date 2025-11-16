import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { tagsService, Collection } from '../services/tagsService';
import { bookmarkStorage } from '../services/bookmarkStorage';
import { Article } from '../types';
import { ArticleCard } from '../components';

interface CollectionDetailScreenProps {
  route: any;
  navigation: any;
}

export const CollectionDetailScreen: React.FC<CollectionDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { theme } = useTheme();
  const { collection: initialCollection } = route.params;
  const [collection, setCollection] = useState<Collection>(initialCollection);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadArticles();
    }, [collection])
  );

  const loadArticles = async () => {
    try {
      const bookmarks = await bookmarkStorage.getBookmarks();
      const collectionArticles = bookmarks.filter(article =>
        collection.articleUrls.includes(article.url)
      );
      setArticles(collectionArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArticlePress = (article: Article) => {
    navigation.navigate('ArticleDetail', {
      article,
      fromCollection: true,
    });
  };

  const handleRemoveArticle = (article: Article) => {
    Alert.alert(
      'Remove Article',
      `Remove "${article.title}" from this collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await tagsService.removeArticleFromCollection(collection.id, article.url);
            setArticles(prev => prev.filter(a => a.url !== article.url));
          },
        },
      ]
    );
  };

  const handleDeleteCollection = () => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"? This won't delete the articles themselves.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await tagsService.deleteCollection(collection.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <View style={styles.articleContainer}>
      <ArticleCard
        article={item}
        onPress={() => handleArticlePress(item)}
        isBookmarked={true}
        onBookmarkToggle={() => {}}
        onShare={() => {}}
      />
      {!collection.isSmartCollection && (
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: theme.error + '20' }]}
          onPress={() => handleRemoveArticle(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color={theme.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: collection.color + '20' }]}>
            <Ionicons name={collection.icon as any} size={20} color={collection.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {collection.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {articles.length} {articles.length === 1 ? 'article' : 'articles'}
            </Text>
          </View>
        </View>

        {!collection.isSmartCollection && (
          <TouchableOpacity
            onPress={handleDeleteCollection}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Collection Info */}
      {collection.description && (
        <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {collection.description}
          </Text>
          {collection.isSmartCollection && (
            <View style={[styles.smartBadge, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="planet" size={14} color={theme.primary} />
              <Text style={[styles.smartText, { color: theme.primary }]}>
                Smart Collection • Auto-organized
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Articles List */}
      {articles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="document-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Articles Yet
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
            {collection.isSmartCollection
              ? 'Articles matching this filter will appear here automatically.'
              : 'Add articles to this collection from article details or bookmarks.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={item => item.url}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  infoSection: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  smartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  smartText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  articleContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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

