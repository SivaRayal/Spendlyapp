import { useMemo } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { radius, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function SegmentedControl({ options, value, onChange, style }) {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    segmentActive: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    label: { ...typography.subhead, color: colors.textSecondary, fontWeight: '500' },
    labelActive: { color: colors.text, fontWeight: '600' },
  }), [colors]);

  return (
    <View style={[styles.wrap, style]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, selected && dynamicStyles.segmentActive]}
          >
            <Text style={[dynamicStyles.label, selected && dynamicStyles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: radius.sm,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm - 2,
  },
});
