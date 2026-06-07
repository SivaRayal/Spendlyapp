import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { radius, spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

const TextField = React.forwardRef(function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  leftAdornment,
  rightAdornment,
  style,
  ...rest
}, ref) {
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => ({
    label: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '500' },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: radius.md, paddingHorizontal: spacing.md },
    input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: 14 },
  }), [colors]);

  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label && <Text style={dynamicStyles.label}>{label}</Text>}
      <View style={[dynamicStyles.inputWrap, multiline && { minHeight: 80 }]}>
        {leftAdornment && <View style={styles.adornLeft}>{leftAdornment}</View>}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          onFocus={(e) => { if (rest.onFocus) rest.onFocus(e); }}
          style={[
            dynamicStyles.input,
            leftAdornment && { paddingLeft: 4 },
            rightAdornment && { paddingRight: 4 },
            multiline && { textAlignVertical: 'top', paddingTop: 12 },
          ]}
          {...rest}
        />
        {rightAdornment && <View style={styles.adornRight}>{rightAdornment}</View>}
      </View>
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  adornLeft: { marginRight: 8 },
  adornRight: { marginLeft: 8 },
});
