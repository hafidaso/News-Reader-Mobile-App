import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No articles found',
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name="newspaper-outline" size={64} color={theme.border} />
      <Text style={[styles.title, { color: theme.text }]}>{message}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Try selecting a different category or check back later
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

