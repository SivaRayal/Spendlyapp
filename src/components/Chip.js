import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';

export default function Chip({ label, icon, color, selected, onPress }) {
  const tint = color || colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: tint, borderColor: tint },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? colors.white : tint}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.white,
    fontWeight: '600',
  },
});
