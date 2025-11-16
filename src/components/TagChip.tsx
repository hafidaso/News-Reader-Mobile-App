import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TagChipProps {
  name: string;
  color: string;
  onPress?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  small?: boolean;
}

export const TagChip: React.FC<TagChipProps> = ({
  name,
  color,
  onPress,
  onRemove,
  selected = false,
  small = false,
}) => {
  const chipStyle = [
    styles.chip,
    small && styles.chipSmall,
    {
      backgroundColor: selected ? color : color + '20',
      borderColor: color,
      borderWidth: selected ? 2 : 1,
    },
  ];

  const textStyle = [
    styles.text,
    small && styles.textSmall,
    { color: selected ? '#FFFFFF' : color },
  ];

  return (
    <TouchableOpacity
      style={chipStyle}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress && !onRemove}
    >
      <Text style={textStyle} numberOfLines={1}>
        {name}
      </Text>
      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="close-circle"
            size={small ? 14 : 16}
            color={selected ? '#FFFFFF' : color}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 12,
  },
  removeButton: {
    marginLeft: 6,
  },
});

