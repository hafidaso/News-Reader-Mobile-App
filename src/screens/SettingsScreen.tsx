import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { bookmarkStorage } from '../services/bookmarkStorage';
import { cacheStorage } from '../services/cacheStorage';
import { notificationService } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
  navigation: any;
}

const APP_VERSION = '1.0.0';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load bookmark count
    const count = await bookmarkStorage.getBookmarksCount();
    setBookmarkCount(count);

    // Load notification status
    const notifSettings = await notificationService.getSettings();
    setNotificationsEnabled(notifSettings.enabled);
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached articles. You can download them again when online.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await cacheStorage.clearAllCache();
              Alert.alert('Success', 'Cache cleared successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleClearBookmarks = async () => {
    Alert.alert(
      'Clear All Bookmarks',
      `This will permanently delete all ${bookmarkCount} bookmarks. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookmarkStorage.clearAllBookmarks();
              setBookmarkCount(0);
              Alert.alert('Success', 'All bookmarks deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bookmarks');
            }
          },
        },
      ]
    );
  };

  const handleResetSettings = async () => {
    Alert.alert(
      'Reset All Settings',
      'This will reset all app settings to defaults. Bookmarks will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset notification settings
              await notificationService.disableNotifications();
              
              // Could add more reset logic here
              
              Alert.alert('Success', 'Settings reset to defaults');
              loadSettings();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const openURL = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette-outline" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={24}
                color={theme.primary}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* AI & Features Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>AI & Features</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('SummarySettings')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  AI Summaries
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Configure article summarization
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('NotificationSettings')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="library-outline" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Content</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Collections')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="folder" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Collections
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Organize articles by topic
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Analytics')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="stats-chart" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Reading Analytics
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  View your reading stats & habits
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('ReadingHistory')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="time" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Reading History
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Recently read articles
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Notes')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Notes & Highlights
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  View your annotations and highlights
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Bookmarks')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="bookmark" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Bookmarks
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {bookmarkCount} saved {bookmarkCount === 1 ? 'article' : 'articles'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color={theme.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Clear Cache
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Remove cached articles
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleClearBookmarks}
            activeOpacity={0.7}
            disabled={bookmarkCount === 0}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="trash-outline"
                size={24}
                color={bookmarkCount === 0 ? theme.border : theme.error}
              />
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: bookmarkCount === 0 ? theme.textSecondary : theme.text },
                  ]}
                >
                  Clear All Bookmarks
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {bookmarkCount === 0 ? 'No bookmarks to clear' : 'Delete all saved articles'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={24} color={theme.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Version</Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {APP_VERSION}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openURL('https://newsapi.org')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="globe-outline" size={24} color={theme.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>News Source</Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Powered by NewsAPI
                </Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openURL('https://github.com')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="logo-github" size={24} color={theme.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Source Code</Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  View on GitHub
                </Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              Alert.alert(
                'News Reader',
                'A modern, feature-rich news application built with React Native and Expo.\n\nFeatures:\n• Browse news by category\n• Search articles\n• Save bookmarks\n• Push notifications\n• Dark mode\n• Offline support\n• Share articles',
                [{ text: 'OK' }]
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={24} color={theme.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>About This App</Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Learn more
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Advanced Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={20} color={theme.text} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Advanced</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleResetSettings}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="refresh-outline" size={24} color={theme.error} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.error }]}>
                  Reset Settings
                </Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Restore defaults
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Made with ❤️ by Hafida Belayd
          </Text>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity
              onPress={() => openURL('https://github.com/hafidaso/')}
              style={styles.socialButton}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-github" size={20} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => openURL('https://www.linkedin.com/in/hafida-belayd/')}
              style={styles.socialButton}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-linkedin" size={20} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => openURL('https://hafida-belayd.me/')}
              style={styles.socialButton}
              activeOpacity={0.7}
            >
              <Ionicons name="globe-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            © 2025 News Reader
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 8,
  },
  socialButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 32,
  },
});

