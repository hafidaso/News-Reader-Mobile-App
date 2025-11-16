import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Note } from '../services/notesService';

interface NoteCardProps {
  note: Note;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showArticleTitle?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
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
          📰 {note.articleTitle}
        </Text>
      )}

      <Text style={[styles.content, { color: theme.text }]} numberOfLines={4}>
        {note.content}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(note.createdAt)}
          </Text>
          {note.updatedAt !== note.createdAt && (
            <>
              <Text style={[styles.separator, { color: theme.textSecondary }]}>•</Text>
              <Text style={[styles.edited, { color: theme.textSecondary }]}>Edited</Text>
            </>
          )}
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
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
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
  },
  date: {
    fontSize: 12,
    marginLeft: 4,
  },
  separator: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  edited: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});

