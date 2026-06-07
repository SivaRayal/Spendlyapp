import { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function Chip({ label, icon, color, selected, onPress }) {
  const { colors } = useTheme();
  const tint = color || colors.primary;

  const chipBase = useMemo(() => ({
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
  }), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={[chipBase, selected && { backgroundColor: tint, borderColor: tint }]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? colors.white : tint}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.label, { color: selected ? colors.white : colors.textSecondary }, selected && styles.labelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.subhead, fontWeight: '500' },
  labelActive: { fontWeight: '600' },
});
