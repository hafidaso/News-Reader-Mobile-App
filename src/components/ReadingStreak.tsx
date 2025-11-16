import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ReadingStreakProps {
  currentStreak: number;
  longestStreak: number;
}

export const ReadingStreak: React.FC<ReadingStreakProps> = ({
  currentStreak,
  longestStreak,
}) => {
  const { theme } = useTheme();

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '📚';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 14) return '🔥🔥🔥';
    return '🔥🔥🔥🔥';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your reading streak today!';
    if (streak === 1) return 'Great start! Keep it going!';
    if (streak < 7) return 'You\'re on fire! Keep reading!';
    if (streak < 14) return 'Amazing streak! You\'re a news enthusiast!';
    if (streak < 30) return 'Incredible! You\'re unstoppable!';
    return 'LEGENDARY! You\'re a reading champion!';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Reading Streak
        </Text>
        <Text style={styles.emoji}>{getStreakEmoji(currentStreak)}</Text>
      </View>

      <View style={styles.streakContainer}>
        <View style={styles.streakItem}>
          <View style={[styles.streakCircle, { backgroundColor: '#FF6B6B' + '20' }]}>
            <Text style={[styles.streakNumber, { color: '#FF6B6B' }]}>
              {currentStreak}
            </Text>
          </View>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
            Current Streak
          </Text>
          <Text style={[styles.streakSubtext, { color: theme.textSecondary }]}>
            {currentStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.streakItem}>
          <View style={[styles.streakCircle, { backgroundColor: '#4ECDC4' + '20' }]}>
            <Text style={[styles.streakNumber, { color: '#4ECDC4' }]}>
              {longestStreak}
            </Text>
          </View>
          <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
            Longest Streak
          </Text>
          <Text style={[styles.streakSubtext, { color: theme.textSecondary }]}>
            {longestStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      <View style={[styles.messageContainer, { backgroundColor: theme.primary + '15' }]}>
        <Ionicons name="trophy" size={20} color={theme.primary} />
        <Text style={[styles.message, { color: theme.primary }]}>
          {getStreakMessage(currentStreak)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  emoji: {
    fontSize: 24,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  streakSubtext: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 60,
    marginHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

