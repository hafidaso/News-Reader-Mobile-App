import React, { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { BookmarksScreen } from './src/screens/BookmarksScreen';
import { ArticleDetailScreen } from './src/screens/ArticleDetailScreen';
import { NotificationSettingsScreen } from './src/screens/NotificationSettingsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ReadingHistoryScreen } from './src/screens/ReadingHistoryScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { CollectionsScreen } from './src/screens/CollectionsScreen';
import { CollectionDetailScreen } from './src/screens/CollectionDetailScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { NoteEditorScreen } from './src/screens/NoteEditorScreen';
import { SummarySettingsScreen } from './src/screens/SummarySettingsScreen';
import { notificationService } from './src/services/notificationService';
import { initializeSummarySettings } from './src/config/initializeSummary';
import { quickActionsService } from './src/services/quickActionsService';
import { bookmarkStorage } from './src/services/bookmarkStorage';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize AI Summary settings with API key
    initializeSummarySettings();
    
    // Configure notification channels for Android
    notificationService.configureNotificationChannels();

    // Initialize deep linking
    quickActionsService.initializeDeepLinking();

    // Listen for notification taps
    const notificationResponseSubscription = notificationService.setupNotificationResponseListener(
      (data) => {
        // Navigate based on notification type
        if (navigationRef.current) {
          if (data.route) {
            // Use the route from notification data
            if (data.article) {
              navigationRef.current.navigate(data.route, { article: data.article });
            } else {
              navigationRef.current.navigate(data.route);
            }
          } else if (data.articleUrl) {
            // Legacy: Navigate to article detail
            navigationRef.current.navigate('ArticleDetail', {
              article: {
                url: data.articleUrl,
                title: data.articleTitle,
                source: { name: data.source, id: null },
                author: null,
                description: null,
                urlToImage: null,
                publishedAt: new Date().toISOString(),
                content: null,
              },
            });
          }
        }
      }
    );

    // Handle deep links
    const handleDeepLink = (event: { url: string }) => {
      const parsed = quickActionsService.parseDeepLink(event.url);
      if (parsed && navigationRef.current) {
        if (parsed.params) {
          navigationRef.current.navigate(parsed.route, parsed.params);
        } else {
          navigationRef.current.navigate(parsed.route);
        }
      }
    };

    // Listen for deep link events
    const deepLinkSubscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial deep link if app was opened via link
    Linking.getInitialURL().then((url: string | null) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // App state change listener for badge updates
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        // Clear badge when app is opened
        await notificationService.clearBadge();
      }
      appState.current = nextAppState;
    });

    // Schedule daily digest (8 AM)
    notificationService.scheduleDailyDigest(8, 0).catch(console.error);

    // Schedule weekly stats (Monday 9 AM)
    notificationService.scheduleWeeklyStats().catch(console.error);

    return () => {
      notificationResponseSubscription.remove();
      deepLinkSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
            <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
            <Stack.Screen name="Collections" component={CollectionsScreen} />
            <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
            <Stack.Screen name="Notes" component={NotesScreen} />
            <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
            <Stack.Screen name="ReadingHistory" component={ReadingHistoryScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="SummarySettings" component={SummarySettingsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

