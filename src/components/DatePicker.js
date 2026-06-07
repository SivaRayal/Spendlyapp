import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DatePicker({ value, onChange, style, label }) {
  const { colors, isDark } = useTheme();
  const [show, setShow] = useState(false);
  const date = value ? new Date(value) : new Date();

  function handleChange(_event, selected) {
    setShow(Platform.OS === 'ios');
    if (selected) onChange(formatISO(selected));
  }

  const dynamicStyles = useMemo(() => ({
    label: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.sm },
    press: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderRadius: 8,
    },
    dateText: { marginLeft: 8, ...typography.body, color: colors.text },
  }), [colors]);

  return (
    <View style={[styles.wrap, style]}>
      {label && <Text style={dynamicStyles.label}>{label}</Text>}
      <Pressable style={dynamicStyles.press} onPress={() => setShow(true)}>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
        <Text style={dynamicStyles.dateText}>{value || formatISO(new Date())}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          themeVariant={isDark ? 'dark' : 'light'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
});
