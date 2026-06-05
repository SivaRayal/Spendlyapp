import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing, typography, shadows } from '../theme';
import PrimaryButton from '../components/PrimaryButton';

export default function LoginScreen({ navigation }) {
  const { users, loginWithBiometric } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleSelect(u) {
    setBusy(true);
    try {
      await loginWithBiometric(u.id);
    } catch (err) {
      Alert.alert('Could not sign in', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={['#0A84FF', '#5E5CE6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.heroContent}>
            <View style={styles.logoWrap}>
              <Ionicons name="wallet" size={36} color={colors.white} />
            </View>
            <Text style={styles.heroTitle}>Spendly</Text>
            <Text style={styles.heroSubtitle}>Kaatha Lo Raasko.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {users.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="person-add-outline" size={42} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Welcome!</Text>
            <Text style={styles.emptyText}>
              No accounts yet. Create one to start tracking expenses.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Choose your account</Text>
            <FlatList
              data={users}
              keyExtractor={(u) => u.id}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <Pressable
                  disabled={busy}
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [styles.userRow, pressed && { opacity: 0.7 }]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  <Ionicons name="finger-print" size={22} color={colors.primary} />
                </Pressable>
              )}
              style={{ flexGrow: 0 }}
            />
          </>
        )}

        <View style={{ flex: 1 }} />

        <PrimaryButton
          title="Create new account"
          icon="add"
          onPress={() => navigation.navigate('Register')}
          variant={users.length === 0 ? 'primary' : 'secondary'}
        />
        <Text style={styles.footer}> </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'flex-start',
  },
  logoWrap: {
    width: 64, height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.largeTitle,
    color: colors.white,
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionLabel: {
    ...typography.footnote,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  sep: { height: spacing.sm },
  avatar: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.title3,
    color: colors.white,
  },
  userName: { ...typography.headline, color: colors.text },
  userEmail: { ...typography.subhead, color: colors.textMuted, marginTop: 2 },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  footer: { marginTop: spacing.xl, marginBottom: spacing.sm, alignItems: 'center', justifyContent: 'center' },
});
