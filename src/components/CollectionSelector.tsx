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
import { tagsService, Collection, COLLECTION_ICONS, TAG_COLORS } from '../services/tagsService';

interface CollectionSelectorProps {
  visible: boolean;
  onClose: () => void;
  articleUrl: string;
  onCollectionsUpdated?: () => void;
}

export const CollectionSelector: React.FC<CollectionSelectorProps> = ({
  visible,
  onClose,
  articleUrl,
  onCollectionsUpdated,
}) => {
  const { theme } = useTheme();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    if (visible) {
      loadCollections();
    }
  }, [visible]);

  const loadCollections = async () => {
    const allCollections = await tagsService.getCollections();
    const regularCollections = allCollections.filter(c => !c.isSmartCollection);
    setCollections(regularCollections);

    // Load which collections contain this article
    const selected = new Set<string>();
    regularCollections.forEach(c => {
      if (c.articleUrls.includes(articleUrl)) {
        selected.add(c.id);
      }
    });
    setSelectedCollections(selected);
  };

  const handleToggleCollection = async (collectionId: string) => {
    const isSelected = selectedCollections.has(collectionId);

    try {
      if (isSelected) {
        await tagsService.removeArticleFromCollection(collectionId, articleUrl);
        setSelectedCollections(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
      } else {
        await tagsService.addArticleToCollection(collectionId, articleUrl);
        setSelectedCollections(prev => new Set(prev).add(collectionId));
      }
      onCollectionsUpdated?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update collection');
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    try {
      const randomIcon = COLLECTION_ICONS[Math.floor(Math.random() * COLLECTION_ICONS.length)];
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const newCollection = await tagsService.createCollection(
        newCollectionName.trim(),
        '',
        randomIcon,
        randomColor
      );

      // Add article to new collection
      await tagsService.addArticleToCollection(newCollection.id, articleUrl);

      setCollections([...collections, newCollection]);
      setSelectedCollections(prev => new Set(prev).add(newCollection.id));
      setNewCollectionName('');
      setShowCreate(false);
      onCollectionsUpdated?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create collection');
    }
  };

  const renderCollection = ({ item }: { item: Collection }) => {
    const isSelected = selectedCollections.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.collectionItem, { backgroundColor: theme.card }]}
        onPress={() => handleToggleCollection(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={24} color={item.color} />
        </View>

        <View style={styles.collectionInfo}>
          <Text style={[styles.collectionName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.collectionCount, { color: theme.textSecondary }]}>
            {item.articleUrls.length} {item.articleUrls.length === 1 ? 'article' : 'articles'}
          </Text>
        </View>

        <View style={[styles.checkbox, isSelected && { backgroundColor: item.color }]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.primary }]}>Done</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Add to Collection</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Collections List */}
        <FlatList
          data={collections}
          renderItem={renderCollection}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No collections yet. Create your first one!
              </Text>
            </View>
          }
        />

        {/* Create Collection Section */}
        {showCreate ? (
          <View style={[styles.createSection, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Collection name"
                placeholderTextColor={theme.textSecondary}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                autoFocus
                maxLength={30}
              />
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.primary }]}
                onPress={handleCreateCollection}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.surface, borderTopColor: theme.border }]}
            onPress={() => setShowCreate(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={24} color={theme.primary} />
            <Text style={[styles.addButtonText, { color: theme.primary }]}>Create New Collection</Text>
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
  headerButton: {
    padding: 4,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 60,
  },
  listContent: {
    padding: 16,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  collectionCount: {
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
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

