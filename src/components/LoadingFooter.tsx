import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LoadingFooterProps {
  visible: boolean;
  isEndReached?: boolean;
}

export const LoadingFooter: React.FC<LoadingFooterProps> = ({ visible, isEndReached }) => {
  const { theme } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isEndReached ? (
        <Text style={[styles.endText, { color: theme.textSecondary }]}>
          You've reached the end 🎉
        </Text>
      ) : (
        <>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading more articles...
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  endText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

