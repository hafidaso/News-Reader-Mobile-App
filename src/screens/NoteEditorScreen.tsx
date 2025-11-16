import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { notesService } from '../services/notesService';

export const NoteEditorScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as {
    noteId?: string;
    articleUrl: string;
    articleTitle: string;
    initialContent?: string;
  };

  const [content, setContent] = useState(params.initialContent || '');
  const [saving, setSaving] = useState(false);

  const isEditing = !!params.noteId;

  const handleSave = async () => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      Alert.alert('Empty Note', 'Please enter some content before saving.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && params.noteId) {
        await notesService.updateNote(params.noteId, trimmedContent);
      } else {
        await notesService.createNote(
          params.articleUrl,
          params.articleTitle,
          trimmedContent
        );
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() && content.trim() !== params.initialContent) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {isEditing ? 'Edit Note' : 'New Note'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {params.articleTitle}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.7}
            disabled={saving || !content.trim()}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Editor */}
        <ScrollView
          style={styles.editorContainer}
          contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Write your note here..."
            placeholderTextColor={theme.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Footer Stats */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="text-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {charCount} {charCount === 1 ? 'character' : 'characters'}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  headerButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
  },
  editorContent: {
    padding: 20,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#666',
    marginHorizontal: 16,
  },
  statText: {
    fontSize: 13,
  },
});

