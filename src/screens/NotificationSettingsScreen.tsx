import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notificationService';
import { Category } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface NotificationSettingsScreenProps {
  navigation: any;
}

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'newspaper-outline' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline' },
  { id: 'technology', label: 'Technology', icon: 'laptop-outline' },
  { id: 'sports', label: 'Sports', icon: 'football-outline' },
  { id: 'health', label: 'Health', icon: 'fitness-outline' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline' },
  { id: 'science', label: 'Science', icon: 'flask-outline' },
];

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [breakingNewsOnly, setBreakingNewsOnly] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Load settings when component mounts
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await notificationService.getSettings();
      const hasPermission = await notificationService.checkPermissions();
      
      setNotificationsEnabled(settings.enabled && hasPermission);
      setBreakingNewsOnly(settings.breakingNewsOnly);
      setSelectedCategories(settings.categories);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      // Enable notifications
      const enabled = await notificationService.enableNotifications();
      if (enabled) {
        setNotificationsEnabled(true);
        Alert.alert(
          'Notifications Enabled',
          'You will now receive breaking news alerts!',
          [{ text: 'OK' }]
        );
      } else {
        setNotificationsEnabled(false);
      }
    } else {
      // Disable notifications
      await notificationService.disableNotifications();
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications Disabled',
        'You will no longer receive news alerts.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleToggleBreakingNews = async (value: boolean) => {
    setBreakingNewsOnly(value);
    await notificationService.toggleBreakingNewsOnly(value);
  };

  const handleToggleCategory = async (category: Category) => {
    let newCategories: Category[];
    
    if (selectedCategories.includes(category)) {
      // Remove category
      newCategories = selectedCategories.filter((c) => c !== category);
    } else {
      // Add category
      newCategories = [...selectedCategories, category];
    }

    setSelectedCategories(newCategories);
    await notificationService.updateCategories(newCategories);
  };

  const handleSelectAll = async () => {
    const allCategories = CATEGORIES.map((c) => c.id);
    setSelectedCategories(allCategories);
    await notificationService.updateCategories(allCategories);
  };

  const handleDeselectAll = async () => {
    setSelectedCategories([]);
    await notificationService.updateCategories([]);
  };

  const handleSendTestNotification = async () => {
    if (!notificationsEnabled) {
      Alert.alert(
        'Enable Notifications First',
        'Please enable notifications to receive test alerts.',
        [{ text: 'OK' }]
      );
      return;
    }

    await notificationService.sendTestNotification();
    Alert.alert(
      'Test Sent!',
      'You should receive a test notification in a moment.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Toggle */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Receive alerts for breaking news
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Breaking News Only */}
        {notificationsEnabled && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="alert-circle" size={24} color={theme.error} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    Breaking News Only
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                    Only urgent and important alerts
                  </Text>
                </View>
              </View>
              <Switch
                value={breakingNewsOnly}
                onValueChange={handleToggleBreakingNews}
                trackColor={{ false: theme.border, true: theme.error }}
                thumbColor="#fff"
              />
            </View>
          </View>
        )}

        {/* Category Selection */}
        {notificationsEnabled && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                News Categories
              </Text>
              <View style={styles.categoryActions}>
                <TouchableOpacity onPress={handleSelectAll} style={styles.actionButton}>
                  <Text style={[styles.actionText, { color: theme.primary }]}>Select All</Text>
                </TouchableOpacity>
                <Text style={[styles.actionSeparator, { color: theme.textSecondary }]}>•</Text>
                <TouchableOpacity onPress={handleDeselectAll} style={styles.actionButton}>
                  <Text style={[styles.actionText, { color: theme.primary }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: theme.card }]}>
              {CATEGORIES.map((category, index) => (
                <View key={category.id}>
                  <TouchableOpacity
                    style={styles.categoryRow}
                    onPress={() => handleToggleCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryLeft}>
                      <Ionicons
                        name={category.icon as any}
                        size={22}
                        color={
                          selectedCategories.includes(category.id)
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.categoryLabel,
                          {
                            color: selectedCategories.includes(category.id)
                              ? theme.text
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {category.label}
                      </Text>
                    </View>
                    <Ionicons
                      name={
                        selectedCategories.includes(category.id)
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={24}
                      color={
                        selectedCategories.includes(category.id) ? theme.primary : theme.border
                      }
                    />
                  </TouchableOpacity>
                  {index < CATEGORIES.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Test Notification */}
        <TouchableOpacity
          style={[
            styles.testButton,
            {
              backgroundColor: notificationsEnabled ? theme.primary : theme.border,
            },
          ]}
          onPress={handleSendTestNotification}
          activeOpacity={0.8}
          disabled={!notificationsEnabled}
        >
          <Ionicons name="paper-plane" size={20} color="#fff" />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            <Text style={{ fontWeight: '600' }}>Testing in Expo Go:{'\n'}</Text>
            Local notifications work great for testing! The "Test Notification" button will show you exactly how alerts look.{'\n\n'}
            <Text style={{ fontWeight: '600' }}>For Production:{'\n'}</Text>
            Build with EAS Build or create a development build to enable full push notification support from servers.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionSeparator: {
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  divider: {
    height: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 32,
  },
});

