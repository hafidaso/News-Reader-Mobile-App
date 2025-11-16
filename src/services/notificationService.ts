import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article, Category } from '../types';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const SCHEDULED_NOTIFICATIONS_KEY = '@scheduled_notifications';

interface NotificationSettings {
  enabled: boolean;
  categories: Category[];
  breakingNewsOnly: boolean;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string; // HH:MM format
}

interface ScheduledNotification {
  id: string;
  type: 'daily-digest' | 'breaking-news' | 'bookmark-reminder';
  scheduledTime: number;
}

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification service for managing push notifications and breaking news alerts
 */
export const notificationService = {
  /**
   * Request notification permissions from user
   */
  requestPermissions: async (): Promise<boolean> => {
    try {
      if (!Device.isDevice) {
        console.log('Notifications only work on physical devices');
        Alert.alert(
          'Notice',
          'Push notifications only work on physical devices, not simulators.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive breaking news alerts.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Get push token for this device
      const token = await notificationService.getExpoPushToken();
      console.log('Push token:', token);

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  /**
   * Get Expo push token for this device
   * Note: Push tokens don't work in Expo Go (SDK 53+)
   * Use development build for production push notifications
   */
  getExpoPushToken: async (): Promise<string | null> => {
    try {
      // Check if we're in Expo Go
      const isExpoGo = Platform.OS === 'ios' ? false : true; // Simplified check
      
      if (isExpoGo) {
        console.log('Push tokens not available in Expo Go. Use development build for production.');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your actual Expo project ID
      });
      return token.data;
    } catch (error) {
      console.log('Push notifications require a development build. Local notifications will still work!');
      return null;
    }
  },

  /**
   * Check if notifications are enabled
   */
  checkPermissions: async (): Promise<boolean> => {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Schedule a local notification (for testing)
   */
  scheduleLocalNotification: async (article: Article): Promise<string | null> => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📰 Breaking News',
          body: article.title,
          data: { 
            articleUrl: article.url,
            articleTitle: article.title,
            source: article.source.name,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  /**
   * Schedule a notification for later
   */
  scheduleDelayedNotification: async (
    article: Article,
    delayInSeconds: number
  ): Promise<string | null> => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📰 Breaking News Alert',
          body: article.title,
          data: { 
            articleUrl: article.url,
            articleTitle: article.title,
            source: article.source.name,
          },
          sound: true,
        },
        trigger: delayInSeconds > 0 ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delayInSeconds,
        } : null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling delayed notification:', error);
      return null;
    }
  },

  /**
   * Cancel a scheduled notification
   */
  cancelNotification: async (notificationId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  /**
   * Cancel all scheduled notifications
   */
  cancelAllNotifications: async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },

  /**
   * Get notification settings from storage
   */
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }

    // Default settings
    return {
      enabled: false,
      categories: ['general', 'business', 'technology', 'sports', 'health', 'entertainment', 'science'],
      breakingNewsOnly: true,
      dailyDigestEnabled: false,
      dailyDigestTime: '08:00',
    };
  },

  /**
   * Save notification settings to storage
   */
  saveSettings: async (settings: NotificationSettings): Promise<void> => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  },

  /**
   * Enable notifications
   */
  enableNotifications: async (): Promise<boolean> => {
    const hasPermission = await notificationService.requestPermissions();
    if (hasPermission) {
      const settings = await notificationService.getSettings();
      settings.enabled = true;
      await notificationService.saveSettings(settings);
      return true;
    }
    return false;
  },

  /**
   * Disable notifications
   */
  disableNotifications: async (): Promise<void> => {
    const settings = await notificationService.getSettings();
    settings.enabled = false;
    await notificationService.saveSettings(settings);
    await notificationService.cancelAllNotifications();
  },

  /**
   * Update category preferences
   */
  updateCategories: async (categories: Category[]): Promise<void> => {
    const settings = await notificationService.getSettings();
    settings.categories = categories;
    await notificationService.saveSettings(settings);
  },

  /**
   * Toggle breaking news only mode
   */
  toggleBreakingNewsOnly: async (enabled: boolean): Promise<void> => {
    const settings = await notificationService.getSettings();
    settings.breakingNewsOnly = enabled;
    await notificationService.saveSettings(settings);
  },

  /**
   * Check if notifications are enabled for a category
   */
  isCategoryEnabled: async (category: Category): Promise<boolean> => {
    const settings = await notificationService.getSettings();
    return settings.enabled && settings.categories.includes(category);
  },

  /**
   * Send a test notification
   */
  sendTestNotification: async (): Promise<void> => {
    const testArticle: Article = {
      source: { id: null, name: 'Test News' },
      author: 'News Reader',
      title: 'This is a test notification! 🎉',
      description: 'If you see this, notifications are working correctly.',
      url: 'https://example.com',
      urlToImage: null,
      publishedAt: new Date().toISOString(),
      content: null,
    };

    await notificationService.scheduleLocalNotification(testArticle);
  },

  /**
   * Set up notification response listener
   */
  setupNotificationResponseListener: (callback: (article: any) => void) => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      callback(data);
    });

    return subscription;
  },

  /**
   * Set up notification received listener (when app is in foreground)
   */
  setupNotificationReceivedListener: (callback: (notification: any) => void) => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      callback(notification);
    });

    return subscription;
  },

  /**
   * Configure notification channels (Android)
   */
  configureNotificationChannels: async (): Promise<void> => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('breaking-news', {
        name: 'Breaking News',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('general-news', {
        name: 'General News',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('daily-digest', {
        name: 'Daily Digest',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        enableVibrate: false,
        showBadge: true,
      });
    }
  },

  /**
   * ========== ENHANCED NOTIFICATIONS ==========
   */

  /**
   * Send rich notification with image and actions
   */
  sendRichNotification: async (
    title: string,
    body: string,
    data?: any,
    imageUrl?: string
  ): Promise<string> => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending rich notification:', error);
      throw error;
    }
  },

  /**
   * Schedule daily digest notification
   */
  scheduleDailyDigest: async (hour: number = 8, minute: number = 0): Promise<string> => {
    try {
      // Cancel existing daily digest
      const scheduled = await notificationService.getScheduledNotifications();
      const existingDigest = scheduled.find(n => n.type === 'daily-digest');
      if (existingDigest) {
        await Notifications.cancelScheduledNotificationAsync(existingDigest.id);
      }

      // Schedule new daily digest
      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📰 Your Daily News Digest',
          body: 'Check out today\'s top headlines and your bookmarks!',
          data: {
            type: 'daily-digest',
            route: 'Home',
          },
          sound: 'default',
          badge: 1,
        },
        trigger,
      });

      // Save to storage
      await notificationService.saveScheduledNotification({
        id: notificationId,
        type: 'daily-digest',
        scheduledTime: new Date().setHours(hour, minute, 0, 0),
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily digest:', error);
      throw error;
    }
  },

  /**
   * Send bookmark reminder notification
   */
  sendBookmarkReminder: async (count: number): Promise<void> => {
    if (count === 0) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔖 Bookmarks Reminder',
          body: `You have ${count} saved ${count === 1 ? 'article' : 'articles'} to read!`,
          data: {
            type: 'bookmark-reminder',
            route: 'Bookmarks',
          },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending bookmark reminder:', error);
    }
  },

  /**
   * Send headline notification with article preview
   */
  sendHeadlineNotification: async (article: Article): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📰 ${article.source.name}`,
          body: article.title,
          data: {
            type: 'headline',
            articleUrl: article.url,
            articleTitle: article.title,
            source: article.source.name,
            route: 'ArticleDetail',
            article: article,
          },
          sound: 'default',
          badge: 1,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending headline notification:', error);
    }
  },

  /**
   * Schedule weekly reading stats notification
   */
  scheduleWeeklyStats: async (): Promise<string> => {
    try {
      const trigger: Notifications.WeeklyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Monday
        hour: 9,
        minute: 0,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Your Weekly Reading Stats',
          body: 'See your reading progress and favorite topics this week!',
          data: {
            type: 'weekly-stats',
            route: 'Analytics',
          },
          sound: 'default',
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling weekly stats:', error);
      throw error;
    }
  },

  /**
   * Get all scheduled notifications
   */
  getScheduledNotifications: async (): Promise<ScheduledNotification[]> => {
    try {
      const data = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  /**
   * Save scheduled notification
   */
  saveScheduledNotification: async (notification: ScheduledNotification): Promise<void> => {
    try {
      const scheduled = await notificationService.getScheduledNotifications();
      scheduled.push(notification);
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduled));
    } catch (error) {
      console.error('Error saving scheduled notification:', error);
    }
  },

  /**
   * Cancel all scheduled notifications
   */
  cancelAllScheduled: async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Error canceling scheduled notifications:', error);
    }
  },

  /**
   * Get notification badge count
   */
  getBadgeCount: async (): Promise<number> => {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  },

  /**
   * Set notification badge count
   */
  setBadgeCount: async (count: number): Promise<void> => {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  },

  /**
   * Clear badge count
   */
  clearBadge: async (): Promise<void> => {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  },
};

