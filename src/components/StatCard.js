import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, shadows, spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function StatCard({ label, value, icon, gradient }) {
  const { colors } = useTheme();
  const useGradient = Array.isArray(gradient);
  const Wrapper = useGradient ? LinearGradient : View;
  const wrapperProps = useGradient
    ? { colors: gradient, start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
    : {};
  const textColor = useGradient ? colors.white : colors.text;
  const labelColor = useGradient ? 'rgba(255,255,255,0.85)' : colors.textMuted;
  const flatBg = useMemo(() => ({ backgroundColor: colors.card }), [colors]);

  return (
    <Wrapper {...wrapperProps} style={[styles.card, useGradient ? null : flatBg]}>
      {icon && (
        <View style={[styles.iconWrap, useGradient && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name={icon} size={18} color={useGradient ? colors.white : colors.primary} />
        </View>
      )}
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.value, { color: textColor }]}>{value}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 110,
    justifyContent: 'space-between',
    ...shadows.card,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  value: { ...typography.title2, marginTop: 2 },
});
