import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { tagsService, Tag, TAG_COLORS } from '../services/tagsService';
import { TagChip } from './TagChip';

interface TagSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedTagIds: string[];
  onTagsSelected: (tagIds: string[]) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  visible,
  onClose,
  selectedTagIds,
  onTagsSelected,
}) => {
  const { theme } = useTheme();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedTagIds);
  const [newTagName, setNewTagName] = useState('');
  const [showCreateTag, setShowCreateTag] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTags();
      setSelectedIds(selectedTagIds);
    }
  }, [visible, selectedTagIds]);

  const loadTags = async () => {
    const allTags = await tagsService.getTags();
    setTags(allTags);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('Error', 'Please enter a tag name');
      return;
    }

    try {
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const newTag = await tagsService.createTag(newTagName.trim(), randomColor);
      setTags([...tags, newTag]);
      setSelectedIds([...selectedIds, newTag.id]);
      setNewTagName('');
      setShowCreateTag(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create tag');
    }
  };

  const handleSave = () => {
    onTagsSelected(selectedIds);
    onClose();
  };

  const renderTag = ({ item }: { item: Tag }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TagChip
        name={item.name}
        color={item.color}
        selected={isSelected}
        onPress={() => handleToggleTag(item.id)}
      />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Select Tags</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={[styles.saveText, { color: theme.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Count */}
        <View style={styles.countContainer}>
          <Text style={[styles.countText, { color: theme.textSecondary }]}>
            {selectedIds.length} {selectedIds.length === 1 ? 'tag' : 'tags'} selected
          </Text>
        </View>

        {/* Tags List */}
        <FlatList
          data={tags}
          renderItem={renderTag}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No tags yet. Create your first tag!
              </Text>
            </View>
          }
        />

        {/* Create Tag Section */}
        {showCreateTag ? (
          <View style={[styles.createSection, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="New tag name"
                placeholderTextColor={theme.textSecondary}
                value={newTagName}
                onChangeText={setNewTagName}
                autoFocus
                maxLength={20}
              />
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.primary }]}
                onPress={handleCreateTag}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowCreateTag(false)}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.surface, borderTopColor: theme.border }]}
            onPress={() => setShowCreateTag(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={24} color={theme.primary} />
            <Text style={[styles.addButtonText, { color: theme.primary }]}>Create New Tag</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createSection: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

