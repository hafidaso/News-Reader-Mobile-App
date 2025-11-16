import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Highlight } from '../services/notesService';

interface HighlightCardProps {
  highlight: Highlight;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showArticleTitle?: boolean;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  highlight,
  onPress,
  onEdit,
  onDelete,
  showArticleTitle = true,
}) => {
  const { theme } = useTheme();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {showArticleTitle && (
        <Text
          style={[styles.articleTitle, { color: theme.primary }]}
          numberOfLines={1}
        >
          📰 {highlight.articleTitle}
        </Text>
      )}

      <View style={[styles.highlightBox, { backgroundColor: highlight.color + '30', borderLeftColor: highlight.color }]}>
        <Text style={[styles.highlightText, { color: theme.text }]} numberOfLines={4}>
          {highlight.text}
        </Text>
      </View>

      {highlight.note && (
        <View style={[styles.noteBox, { backgroundColor: theme.background }]}>
          <Ionicons name="document-text-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.noteText, { color: theme.text }]} numberOfLines={2}>
            {highlight.note}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.colorDot, { backgroundColor: highlight.color }]} />
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(highlight.createdAt)}
          </Text>
        </View>

        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil" size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  highlightBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  date: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});

