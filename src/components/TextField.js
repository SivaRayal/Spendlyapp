import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

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
  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, multiline && { minHeight: 80 }]}>
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
          onFocus={(e) => {
            if (rest.onFocus) rest.onFocus(e);
          }}
          style={[
            styles.input,
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
  label: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 14,
  },
  adornLeft: { marginRight: 8 },
  adornRight: { marginLeft: 8 },
});
