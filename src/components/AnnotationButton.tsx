import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface AnnotationButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count?: number;
  onPress: () => void;
  color?: string;
}

export const AnnotationButton: React.FC<AnnotationButtonProps> = ({
  icon,
  label,
  count,
  onPress,
  color,
}) => {
  const { theme } = useTheme();
  const buttonColor = color || theme.primary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: buttonColor + '15', borderColor: buttonColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color={buttonColor} />
      <Text style={[styles.label, { color: buttonColor }]}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.badge, { backgroundColor: buttonColor }]}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

