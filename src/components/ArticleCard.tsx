import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Article } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { shareService } from '../services/shareService';
import { summaryService, ArticleSummary } from '../services/summaryService';

interface ArticleCardProps {
  article: Article;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onPress?: () => void;
  onShare?: () => void;
  showSummary?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isBookmarked = false,
  onBookmarkToggle,
  onPress,
  onShare,
  showSummary = false,
}) => {
  const { theme } = useTheme();
  const [summary, setSummary] = useState<ArticleSummary | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (showSummary) {
      loadSummary();
    }
  }, [showSummary, article.url]);

  const loadSummary = async () => {
    const cached = await summaryService.getSummary(article.url);
    if (cached) {
      setSummary(cached);
    } else {
      // Generate fallback summary
      const fallback = summaryService.generateFallbackSummary(article);
      setSummary(fallback);
    }
  };
  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else {
      // Fallback to opening in browser
      try {
        const canOpen = await Linking.canOpenURL(article.url);
        if (canOpen) {
          await Linking.openURL(article.url);
        } else {
          console.error('Cannot open URL:', article.url);
        }
      } catch (error) {
        console.error('Error opening article:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleBookmarkPress = (e: any) => {
    e.stopPropagation();
    if (onBookmarkToggle) {
      onBookmarkToggle();
    }
  };

  const handleSharePress = async (e: any) => {
    e.stopPropagation();
    if (onShare) {
      onShare();
    } else {
      await shareService.shareArticle(article);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>
              {article.title}
            </Text>
            {onBookmarkToggle && (
              <TouchableOpacity
                onPress={handleBookmarkPress}
                style={styles.bookmarkButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isBookmarked ? theme.primary : theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          {article.description && (
            <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
              {article.description}
            </Text>
          )}
          <View style={styles.metadata}>
            <Text style={[styles.source, { color: theme.textSecondary }]} numberOfLines={1}>
              {article.source.name}
            </Text>
            <Text style={[styles.dot, { color: theme.textSecondary }]}>•</Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDate(article.publishedAt)}</Text>
          </View>
        </View>
        {article.urlToImage && (
          <Image
            source={{ uri: article.urlToImage }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
      </View>
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <View style={styles.footerLeft}>
          {summary && (
            <>
              <View style={styles.readingTimeBadge}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.readingTimeText, { color: theme.textSecondary }]}>
                  {summary.readingTime} min
                </Text>
              </View>
              {showSummary && (
                <>
                  <Text style={[styles.dot, { color: theme.textSecondary }]}>•</Text>
                  <TouchableOpacity
                    onPress={() => setShowPreview(!showPreview)}
                    style={styles.summaryToggle}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showPreview ? 'eye-off-outline' : 'eye-outline'} 
                      size={14} 
                      color={theme.primary} 
                    />
                    <Text style={[styles.summaryToggleText, { color: theme.primary }]}>
                      {showPreview ? 'Hide' : 'Preview'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
          {!summary && (
            <>
              <Ionicons name="open-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.readMore, { color: theme.textSecondary }]}>Read full article</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          onPress={handleSharePress}
          style={styles.shareButton}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Preview */}
      {showPreview && summary && (
        <View style={[styles.summaryPreview, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Quick Summary</Text>
          <Text style={[styles.summaryText, { color: theme.text }]} numberOfLines={3}>
            {summary.summary}
          </Text>
          {summary.keyPoints.length > 0 && (
            <View style={styles.keyPointsPreview}>
              {summary.keyPoints.slice(0, 2).map((point, index) => (
                <View key={index} style={styles.keyPointPreview}>
                  <View style={[styles.bulletSmall, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.keyPointPreviewText, { color: theme.text }]} numberOfLines={1}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  bookmarkButton: {
    padding: 4,
    marginTop: -4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  source: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '60%',
  },
  dot: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  date: {
    fontSize: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readMore: {
    fontSize: 13,
    fontWeight: '500',
  },
  shareButton: {
    padding: 4,
  },
  readingTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readingTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryPreview: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  keyPointsPreview: {
    gap: 6,
  },
  keyPointPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  keyPointPreviewText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

