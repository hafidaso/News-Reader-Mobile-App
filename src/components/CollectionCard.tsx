import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Collection } from '../services/tagsService';

interface CollectionCardProps {
  collection: Collection;
  onPress: () => void;
  articleCount?: number;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onPress,
  articleCount,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: collection.color + '20' }]}>
        <Ionicons name={collection.icon as any} size={32} color={collection.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {collection.name}
          </Text>
          {collection.isSmartCollection && (
            <View style={[styles.smartBadge, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="planet" size={12} color={theme.primary} />
              <Text style={[styles.smartText, { color: theme.primary }]}>Smart</Text>
            </View>
          )}
        </View>

        {collection.description && (
          <Text
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {collection.description}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={[styles.count, { color: theme.textSecondary }]}>
            {articleCount !== undefined
              ? `${articleCount} ${articleCount === 1 ? 'article' : 'articles'}`
              : `${collection.articleUrls.length} ${collection.articleUrls.length === 1 ? 'article' : 'articles'}`}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  smartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  smartText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
  },
});

