import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { radius, shadows, spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function Card({ style, children, padded = true, elevated = false }) {
  const { colors } = useTheme();
  const cardStyle = useMemo(() => ({ backgroundColor: colors.card, borderRadius: radius.lg }), [colors]);

  return (
    <View
      style={[
        cardStyle,
        padded && styles.padded,
        elevated ? shadows.raised : shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: spacing.lg },
});
