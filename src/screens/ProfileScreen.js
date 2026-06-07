import { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, Animated, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Screen from '../components/Screen';
import Card from '../components/Card';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getExpensesFilePath } from '../db/excelDb';
import { spacing, typography, radius } from '../theme';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const { colors, isDark, toggleTheme, toggleAnim } = useTheme();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [busy, setBusy] = useState(false);

  const iconRotation = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  async function handleSave() {
    if (!form.name.trim()) return Alert.alert('Missing info', 'Name is required.');
    setBusy(true);
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
      Alert.alert('Saved', 'Profile updated.');
    } catch (err) {
      Alert.alert('Could not save', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    try {
      const path = getExpensesFilePath(user.id);
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) { Alert.alert('Nothing to export', 'Add an expense first.'); return; }
      const available = await Sharing.isAvailableAsync();
      if (!available) { Alert.alert('Sharing unavailable', `File path:\n${path}`); return; }
      await Sharing.shareAsync(path, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Share expenses spreadsheet',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
    } catch (err) {
      Alert.alert('Could not share', err.message);
    }
  }

  function handleLogout() {
    Alert.alert('Sign out?', 'You can sign back in with biometrics anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  if (!user) return null;
  const initials = user.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  const dynamicStyles = useMemo(() => ({
    name:       { ...typography.title2, color: colors.text },
    email:      { ...typography.subhead, color: colors.textMuted, marginTop: 4 },
    section:    { ...typography.footnote, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: spacing.xs },
    actionLabel:{ ...typography.body, color: colors.text },
    actionSub:  { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
    divider:    { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: spacing.lg + 36 + spacing.md },
    actionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,122,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    darkModeRow:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    darkModeIcon:{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  }), [colors, isDark]);

  return (
    <Screen title="Profile">
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={dynamicStyles.name}>{user.name}</Text>
        <Text style={dynamicStyles.email}>{user.email}</Text>
        <View style={styles.bioBadge}>
          <Ionicons name="finger-print" size={14} color={colors.primary} />
          <Text style={[styles.bioText, { color: colors.primary }]}>Biometric protected</Text>
        </View>
      </View>

      <Text style={dynamicStyles.section}>Account</Text>
      <Card>
        <TextField label="Full name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoCapitalize="words" />
        <TextField label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" style={{ marginBottom: 0 }} />
      </Card>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton title="Save changes" onPress={handleSave} loading={busy} icon="checkmark-circle" />

      <Text style={dynamicStyles.section}>Appearance</Text>
      <Card padded={false}>
        <View style={dynamicStyles.darkModeRow}>
          <View style={dynamicStyles.darkModeIcon}>
            <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
            </Animated.View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={dynamicStyles.actionLabel}>Dark mode</Text>
            <Text style={dynamicStyles.actionSub}>{isDark ? 'Dark theme active' : 'Light theme active'}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.inputBg, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </Card>

      <Text style={dynamicStyles.section}>Data</Text>
      <Card padded={false}>
        <ActionRow
          icon="share-outline"
          label="Export Excel file"
          subtitle="Share or save your full expense workbook"
          onPress={handleShare}
          colors={colors}
          dynamicStyles={dynamicStyles}
        />
        <View style={dynamicStyles.divider} />
        <ActionRow
          icon="information-circle-outline"
          label="Account created"
          subtitle={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
          colors={colors}
          dynamicStyles={dynamicStyles}
        />
      </Card>

      <View style={{ height: spacing.xl }} />
      <PrimaryButton title="Sign out" variant="danger" icon="log-out-outline" onPress={handleLogout} />
      <Text style={styles.footer}>&nbsp;</Text>
    </Screen>
  );
}

function ActionRow({ icon, label, subtitle, onPress, colors, dynamicStyles }) {
  const Container = onPress ? Pressable : View;
  const leftIcon = !!onPress;
  return (
    <Container
      onPress={onPress}
      {...(onPress ? { style: ({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }] } : { style: styles.actionRow })}
    >
      {leftIcon && (
        <View style={dynamicStyles.actionIcon}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={dynamicStyles.actionLabel}>{label}</Text>
        {subtitle && <Text style={dynamicStyles.actionSub}>{subtitle}</Text>}
      </View>
      {!onPress && icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />}
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </Container>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: {
    width: 84, height: 84,
    borderRadius: 42,
    backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { ...typography.title, color: '#FFFFFF' },
  bioBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.12)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, marginTop: spacing.sm,
  },
  bioText: { ...typography.footnote, marginLeft: 4, fontWeight: '500' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  footer: { marginTop: spacing.xl, marginBottom: spacing.sm },
});
