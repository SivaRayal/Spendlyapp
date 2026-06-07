import { useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
}) {
  const { colors } = useTheme();

  const VARIANTS = useMemo(() => ({
    primary:   { bg: { backgroundColor: colors.primary },  label: { color: colors.white } },
    secondary: { bg: { backgroundColor: colors.inputBg },  label: { color: colors.primary } },
    danger:    { bg: { backgroundColor: colors.danger },   label: { color: colors.white } },
  }), [colors]);

  const styleSet = VARIANTS[variant] || VARIANTS.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styleSet.bg,
        (pressed || loading) && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={styleSet.label.color} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={20} color={styleSet.label.color} style={{ marginRight: 8 }} />}
          <Text style={[styles.label, styleSet.label]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { ...typography.headline },
});
