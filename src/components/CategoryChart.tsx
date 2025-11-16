import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface CategoryChartProps {
  data: { [key: string]: number };
  title: string;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  general: '#1DA1F2',
  business: '#2ECC71',
  technology: '#9B59B6',
  sports: '#E74C3C',
  health: '#E67E22',
  entertainment: '#F39C12',
  science: '#3498DB',
};

export const CategoryChart: React.FC<CategoryChartProps> = ({ data, title }) => {
  const { theme } = useTheme();

  const sortedData = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7); // Top 7 categories

  const total = sortedData.reduce((sum, [, count]) => sum + count, 0);

  if (sortedData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No data available yet
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      {sortedData.map(([category, count]) => {
        const percentage = Math.round((count / total) * 100);
        const color = CATEGORY_COLORS[category.toLowerCase()] || theme.primary;

        return (
          <View key={category} style={styles.barContainer}>
            <View style={styles.barHeader}>
              <Text style={[styles.categoryLabel, { color: theme.text }]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <Text style={[styles.categoryValue, { color: theme.textSecondary }]}>
                {count} ({percentage}%)
              </Text>
            </View>

            <View style={[styles.barBackground, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.barFill,
                  { backgroundColor: color, width: `${percentage}%` },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  barContainer: {
    marginBottom: 12,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryValue: {
    fontSize: 13,
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});

