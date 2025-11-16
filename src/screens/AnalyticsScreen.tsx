import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { readingHistoryService, ReadingStats } from '../services/readingHistoryService';
import { StatCard, CategoryChart, ReadingStreak, LoadingState } from '../components';

interface AnalyticsScreenProps {
  navigation: any;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const statsData = await readingHistoryService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!stats || stats.totalArticlesRead === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>📊 Analytics</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="bar-chart-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Analytics Yet
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
            Start reading articles to see your reading statistics, habits, and trends!
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>Start Reading</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>📊 Analytics</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ReadingHistory')}
          style={styles.historyButton}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Reading Streak */}
        <ReadingStreak
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />

        {/* Key Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="book"
            label="Total Articles"
            value={stats.totalArticlesRead}
            color="#1DA1F2"
          />

          <StatCard
            icon="time"
            label="Reading Time"
            value={formatTime(stats.totalReadingTime)}
            color="#2ECC71"
            subtitle="total time spent"
          />

          <StatCard
            icon="speedometer"
            label="Avg. Reading Time"
            value={formatTime(stats.averageReadingTime)}
            color="#9B59B6"
            subtitle="per article"
          />

          <StatCard
            icon="trophy"
            label="Favorite Category"
            value={stats.favoriteCategory}
            color="#E67E22"
          />
        </View>

        {/* Time Period Stats */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Reading Activity
          </Text>

          <View style={styles.periodStatsContainer}>
            <View style={styles.periodStat}>
              <Text style={[styles.periodValue, { color: theme.text }]}>
                {stats.articlesReadToday}
              </Text>
              <Text style={[styles.periodLabel, { color: theme.textSecondary }]}>
                Today
              </Text>
            </View>

            <View style={[styles.periodDivider, { backgroundColor: theme.border }]} />

            <View style={styles.periodStat}>
              <Text style={[styles.periodValue, { color: theme.text }]}>
                {stats.articlesReadThisWeek}
              </Text>
              <Text style={[styles.periodLabel, { color: theme.textSecondary }]}>
                This Week
              </Text>
            </View>

            <View style={[styles.periodDivider, { backgroundColor: theme.border }]} />

            <View style={styles.periodStat}>
              <Text style={[styles.periodValue, { color: theme.text }]}>
                {stats.articlesReadThisMonth}
              </Text>
              <Text style={[styles.periodLabel, { color: theme.textSecondary }]}>
                This Month
              </Text>
            </View>
          </View>
        </View>

        {/* Categories Chart */}
        <CategoryChart
          data={stats.categoriesBreakdown}
          title="📚 Reading by Category"
        />

        {/* Sources Chart */}
        <CategoryChart
          data={stats.sourcesBreakdown}
          title="📰 Reading by Source"
        />

        {/* Insights Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Insights
            </Text>
          </View>

          <View style={styles.insightsContainer}>
            {stats.totalReadingTime > 60 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>🎓</Text>
                <Text style={[styles.insightText, { color: theme.text }]}>
                  You've spent over {Math.floor(stats.totalReadingTime / 60)} hours reading. That's dedication!
                </Text>
              </View>
            )}

            {stats.currentStreak >= 7 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>🔥</Text>
                <Text style={[styles.insightText, { color: theme.text }]}>
                  {stats.currentStreak} day streak! You're building a great reading habit.
                </Text>
              </View>
            )}

            {stats.totalArticlesRead >= 50 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>📚</Text>
                <Text style={[styles.insightText, { color: theme.text }]}>
                  You've read {stats.totalArticlesRead}+ articles. You're very well-informed!
                </Text>
              </View>
            )}

            {Object.keys(stats.categoriesBreakdown).length >= 5 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>🌟</Text>
                <Text style={[styles.insightText, { color: theme.text }]}>
                  You read from {Object.keys(stats.categoriesBreakdown).length} different categories. Great diversity!
                </Text>
              </View>
            )}

            {stats.averageReadingTime > 5 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>⏱️</Text>
                <Text style={[styles.insightText, { color: theme.text }]}>
                  Average {formatTime(stats.averageReadingTime)} per article shows thorough reading.
                </Text>
              </View>
            )}

            {/* Default insight if none of the above apply */}
            {stats.totalReadingTime <= 60 && stats.currentStreak < 7 && stats.totalArticlesRead < 50 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightEmoji}>🚀</Text>
                <Text style={[styles.insightText, { color: theme.text }]}>
                  You're off to a great start! Keep reading to unlock more insights.
                </Text>
              </View>
            )}
          </View>
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
    flex: 1,
    textAlign: 'center',
  },
  historyButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statsGrid: {
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  periodStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  periodStat: {
    alignItems: 'center',
    flex: 1,
  },
  periodValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  periodLabel: {
    fontSize: 13,
  },
  periodDivider: {
    width: 1,
    height: 40,
  },
  insightsContainer: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 32,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

