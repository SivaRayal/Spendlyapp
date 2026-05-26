import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';

export default function RegisterScreen({ navigation }) {
  const { registerUser, loginWithBiometric, getBiometricCapability } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function handleRegister() {
    if (!form.name.trim()) return Alert.alert('Missing info', 'Name is required.');
    if (!form.email.trim() || !form.email.includes('@')) return Alert.alert('Missing info', 'Enter a valid email.');

    setBusy(true);
    try {
      const cap = await getBiometricCapability();
      if (!cap.hasHardware) {
        Alert.alert(
          'No biometrics',
          'This device has no biometric hardware. We will still create your account, but anyone with the device can open the app.',
        );
      } else if (!cap.enrolled) {
        Alert.alert(
          'Set up biometrics',
          'Please enable Face ID / fingerprint in system settings, then return here.',
        );
        return;
      }

      const { created } = await registerUser(form);
      // Immediately try biometric login so the user lands inside.
      try {
        await loginWithBiometric(created.id);
      } catch (e) {
        Alert.alert('Account created', 'Sign in from the home screen to continue.');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Could not create account', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </Pressable>
          <Text style={styles.title}>Create account</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>
            Your data stays on this device. We use Face ID / fingerprint to lock the app.
          </Text>

          <TextField
            label="Full name"
            value={form.name}
            onChangeText={(v) => update('name', v)}
            placeholder="Your name"
            autoCapitalize="words"
          />
          <TextField
            label="Email"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Phone (optional)"
            value={form.phone}
            onChangeText={(v) => update('phone', v)}
            placeholder="+91 …"
            keyboardType="phone-pad"
          />

          <PrimaryButton
            title="Create account"
            icon="finger-print"
            onPress={handleRegister}
            loading={busy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: { ...typography.headline, color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  lead: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
});
