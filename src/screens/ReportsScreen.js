import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import SegmentedControl from '../components/SegmentedControl';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { listMonth, listYear, summarize } from '../db/excelDb';
import { inr, MONTH_NAMES, MONTH_SHORT } from '../theme/format';
import { colors, spacing, typography, radius, CATEGORY_META } from '../theme';

export default function ReportsScreen() {
  const { user } = useAuth();
  const now = new Date();
  const [mode, setMode] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (mode === 'monthly') {
        const expenses = await listMonth(user.id, year, month);
        setData({ kind: 'monthly', summary: summarize(expenses), expenses });
      } else {
        const expenses = await listYear(user.id, year);
        const monthly = {};
        for (let m = 1; m <= 12; m++) monthly[m] = { credit: 0, debit: 0 };
        for (const e of expenses) {
          const m = Number(e.date.slice(5, 7));
          if (e.type === 'Credit') monthly[m].credit += Number(e.amount);
          else if (e.type === 'Debit') monthly[m].debit += Number(e.amount);
        }
        setData({ kind: 'yearly', summary: summarize(expenses), monthly });
      }
    } finally {
      setLoading(false);
    }
  }, [user, mode, year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen title="Reports" subtitle="Insights into your spending">
      <SegmentedControl
        options={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'yearly',  label: 'Yearly'  },
        ]}
        value={mode}
        onChange={setMode}
        style={{ marginBottom: spacing.lg }}
      />

      <View style={styles.periodCard}>
        <Pressable onPress={() => shiftYear(-1, year, setYear)} style={styles.arrow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.periodLabel}>
          {mode === 'monthly' ? `${MONTH_NAMES[month - 1]} ${year}` : `Year ${year}`}
        </Text>
        <Pressable onPress={() => shiftYear(1, year, setYear)} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {mode === 'monthly' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: spacing.sm }}
        >
          {MONTH_SHORT.map((mn, i) => {
            const m = i + 1;
            const selected = m === month;
            return (
              <Pressable
                key={mn}
                onPress={() => setMonth(m)}
                style={[styles.monthPill, selected && styles.monthPillActive]}
              >
                <Text style={[styles.monthPillText, selected && styles.monthPillTextActive]}>{mn}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {loading || !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <StatCard label="Credit" value={inr(data.summary.totalCredit)} icon="arrow-down-circle-outline" />
            <View style={{ width: spacing.md }} />
            <StatCard label="Debit"  value={inr(data.summary.totalDebit)}  icon="arrow-up-circle-outline" />
          </View>
          <View style={styles.row}>
            <StatCard
              label="Net"
              value={inr(data.summary.net)}
              icon={data.summary.net >= 0 ? 'trending-up' : 'trending-down'}
            />
            <View style={{ width: spacing.md }} />
            <StatCard label="Entries" value={String(data.summary.count)} icon="layers-outline" />
          </View>

          {data.kind === 'yearly' && <MonthlyBreakdown monthly={data.monthly} />}
          <CategoryBreakdown byCategory={data.summary.byCategory} />
          <TopSpending top={data.summary.topSpending} />
        </>
      )}
    </Screen>
  );
}

function shiftYear(delta, year, setYear) {
  setYear(year + delta);
}

function MonthlyBreakdown({ monthly }) {
  return (
    <>
      <Text style={styles.section}>Monthly breakdown</Text>
      <Card padded={false} style={{ paddingVertical: spacing.sm }}>
        {Object.entries(monthly).map(([m, v], i) => {
          const net = v.credit - v.debit;
          return (
            <View key={m} style={[styles.dataRow, i > 0 && styles.divider]}>
              <Text style={styles.dataRowLabel}>{MONTH_NAMES[Number(m) - 1]}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.dataRowAmount, { color: net >= 0 ? colors.success : colors.danger }]}>
                  {inr(net)}
                </Text>
                <Text style={styles.dataRowSub}>
                  +{inr(v.credit)} · -{inr(v.debit)}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>
    </>
  );
}

function CategoryBreakdown({ byCategory }) {
  const rows = Object.entries(byCategory).filter(([, v]) => v.credit !== 0 || v.debit !== 0);
  return (
    <>
      <Text style={styles.section}>Category breakdown</Text>
      {rows.length === 0 ? (
        <Card><Text style={styles.empty}>No data yet.</Text></Card>
      ) : (
        <Card padded={false} style={{ paddingVertical: spacing.sm }}>
          {rows.map(([cat, v], i) => {
            const meta = CATEGORY_META[cat] || {};
            const net = v.credit - v.debit;
            return (
              <View key={cat} style={[styles.catBreakRow, i > 0 && styles.divider]}>
                <View style={[styles.catIcon, { backgroundColor: (meta.color || colors.primary) + '22' }]}>
                  <Ionicons name={meta.icon || 'pricetag-outline'} size={18} color={meta.color || colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dataRowLabel}>{cat}</Text>
                  <Text style={styles.dataRowSub}>
                    +{inr(v.credit)} · -{inr(v.debit)}
                  </Text>
                </View>
                <Text style={[styles.dataRowAmount, { color: net >= 0 ? colors.success : colors.danger }]}>
                  {inr(net)}
                </Text>
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

function TopSpending({ top }) {
  return (
    <>
      <Text style={styles.section}>Top 5 spending</Text>
      {(!top || top.length === 0) ? (
        <Card><Text style={styles.empty}>No debit transactions yet.</Text></Card>
      ) : (
        <Card padded={false} style={{ paddingVertical: spacing.sm }}>
          {top.map((e, i) => {
            const meta = CATEGORY_META[e.category] || {};
            return (
              <View key={e.id} style={[styles.txRow, i > 0 && styles.divider]}>
                <View style={[styles.catIcon, { backgroundColor: (meta.color || colors.primary) + '22' }]}>
                  <Ionicons name={meta.icon || 'pricetag-outline'} size={18} color={meta.color || colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle} numberOfLines={1}>{e.details}</Text>
                  <Text style={styles.dataRowSub}>{e.category} · {e.date} · {e.mode}</Text>
                </View>
                <Text style={[styles.dataRowAmount, { color: colors.danger }]}>
                  -{inr(e.amount)}
                </Text>
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: spacing.md },
  center: { padding: spacing.xl, alignItems: 'center' },
  section: {
    ...typography.title3,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  arrow: { padding: 8 },
  periodLabel: { ...typography.headline, color: colors.text },
  monthPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.inputBg,
    marginRight: 8,
  },
  monthPillActive: { backgroundColor: colors.primary },
  monthPillText: { ...typography.subhead, color: colors.textSecondary, fontWeight: '500' },
  monthPillTextActive: { color: colors.white, fontWeight: '600' },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  catIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  catBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  dataRowLabel: { ...typography.body, color: colors.text },
  dataRowSub: { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
  dataRowAmount: { ...typography.headline },
  txTitle: { ...typography.body, color: colors.text },
});
