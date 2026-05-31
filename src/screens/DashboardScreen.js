import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { listMonth, summarize } from '../db/excelDb';
import { inr, MONTH_NAMES } from '../theme/format';
import { colors, spacing, typography, radius, CATEGORY_META } from '../theme';

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const expenses = await listMonth(user.id, year, month);
      const summary = summarize(expenses);
      setData({ expenses, summary });
    } catch (err) {
      setData({ expenses: [], summary: summarize([]) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <Screen scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const { summary, expenses } = data;
  const recent = [...expenses].reverse();
  const topCategories = Object.entries(summary.byCategory || {})
    .filter(([, v]) => v.debit > 0)
    .sort((a, b) => b[1].debit - a[1].debit)
    .slice(0, 5);

  const netPositive = (summary.net || 0) >= 0;

  return (
    <Screen
      title={`Hi, ${user?.name}`}
      subtitle={`${MONTH_NAMES[month - 1]} ${year} overview`}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
    >
      <StatCard
        label="Net balance"
        value={inr(summary.net)}
        icon="wallet"
        gradient={netPositive ? ['#0A84FF', '#5E5CE6'] : ['#FF3B30', '#FF2D55']}
      />

      <View style={styles.row}>
        <StatCard label="Credit" value={inr(summary.totalCredit)} icon="arrow-down-circle-outline" />
        <View style={{ width: spacing.md }} />
        <StatCard label="Debit"  value={inr(summary.totalDebit)}  icon="arrow-up-circle-outline" />
      </View>

      <View style={styles.row}>
        <StatCard label="Transactions" value={String(summary.count || 0)} icon="list-outline" />
        <View style={{ width: spacing.md }} />
        <StatCard
          label="Top category"
          value={topCategories[0]?.[0] || '—'}
          icon="trophy-outline"
        />
      </View>

      <SectionHeader title="Top spending" />
      {topCategories.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No spending recorded this month.</Text>
        </Card>
      ) : (
        <Card padded={false} style={{ paddingVertical: spacing.sm }}>
          {topCategories.map(([cat, v], i) => {
            const meta = CATEGORY_META[cat] || {};
            return (
              <View key={cat} style={[styles.catRow, i > 0 && styles.catRowDivider]}>
                <View style={[styles.catIcon, { backgroundColor: (meta.color || colors.primary) + '22' }]}>
                  <Ionicons name={meta.icon || 'pricetag-outline'} size={18} color={meta.color || colors.primary} />
                </View>
                <Text style={styles.catName}>{cat}</Text>
                <Text style={styles.catAmount}>{inr(v.debit)}</Text>
              </View>
            );
          })}
        </Card>
      )}

      <SectionHeader title={`${MONTH_NAMES[month - 1]} ${year} activity`} />
      {recent.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            No transactions yet this month. Tap the + tab to add one.
          </Text>
        </Card>
      ) : (
        <Card padded={false} style={{ paddingVertical: spacing.sm }}>
          {recent.map((e, i) => {
            const meta = CATEGORY_META[e.category] || {};
            const isCredit = e.type === 'Credit';
            return (
              <Pressable key={e.id} onPress={() => navigation.navigate('Add', { expense: e })}>
                <View style={[styles.txRow, i > 0 && styles.catRowDivider]}>
                <View style={[styles.catIcon, { backgroundColor: (meta.color || colors.primary) + '22' }]}>
                  <Ionicons name={meta.icon || 'pricetag-outline'} size={18} color={meta.color || colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle} numberOfLines={1}>{e.details}</Text>
                  <Text style={styles.txSub}>{e.category} · {e.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: isCredit ? colors.success : colors.danger }]}>
                  {isCredit ? '+' : '-'}{inr(e.amount)}
                </Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
      )}
      <Text style={styles.footer}> &nbsp;</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', marginTop: spacing.md },
  sectionHeader: {
    ...typography.title3,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  catRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  catIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  catName: { flex: 1, ...typography.body, color: colors.text },
  catAmount: { ...typography.headline, color: colors.text },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  txTitle: { ...typography.body, color: colors.text },
  txSub: { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
  txAmount: { ...typography.headline },
  footer: { marginTop: spacing.xl, marginBottom: spacing.sm, alignItems: 'center', justifyContent: 'center' },
});
