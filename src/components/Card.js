import { View, StyleSheet } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

export default function Card({ style, children, padded = true, elevated = false }) {
  return (
    <View
      style={[
        styles.card,
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
  },
  padded: {
    padding: spacing.lg,
  },
});
