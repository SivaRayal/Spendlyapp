import { useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable,
  Modal, FlatList, TouchableOpacity, Animated, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopSpending from '../components/TopSpending';
import Screen from '../components/Screen';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { listMonth, summarize, deleteExpense } from '../db/excelDb';
import { inr, MONTH_NAMES } from '../theme/format';
import { colors, spacing, typography, CATEGORY_META, shadows } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // tracks in-progress delete

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const expenses = await listMonth(user.id, year, month);
      const summary  = summarize(expenses);
      setData({ expenses, summary });
    } catch {
      setData({ expenses: [], summary: summarize([]) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Delete handler (used by Recent Transactions rows) ─────────────────────
  function handleDelete(item) {
    Alert.alert(
      'Delete transaction?',
      `"${item.details || 'This transaction'}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeletingId(item.id);
            try {
              await deleteExpense(user.id, item.id);
              await load(); // refresh dashboard data after delete
            } catch (err) {
              Alert.alert('Could not delete', err.message);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  }

  // ── Edit handler — navigates to the Add tab pre-filled ───────────────────
  function handleEdit(item) {
    navigation.navigate('Add', { expense: item });
  }

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

  const topCategories = Object.entries(summary.byCategory || {})
    .filter(([, v]) => v.debit > 0)
    .sort((a, b) => b[1].debit - a[1].debit)
    .slice(0, 5);

  const netPositive = (summary.net || 0) >= 0;

  // Last 5 transactions, newest first
  const recentFive = [...expenses].reverse().slice(0, 5);

  // Items for the active category overlay — filtered in-memory, no extra DB call
  const categoryItems = activeCategory
    ? expenses.filter(e => e.category === activeCategory)
    : [];

  return (
    <>
      <Screen
        title={`Hi, ${user?.name}`}
        subtitle={`${MONTH_NAMES[month - 1]} ${year} overview`}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); load(); }}
      >
        {/* ── Summary stat cards ─────────────────────────────────────────── */}
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

        {/* ── Recent transactions ────────────────────────────────────────── */}
        <RecentTransactions
          items={recentFive}
          deletingId={deletingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* ── Top 5 spending ─────────────────────────────────────────────── */}
        <TopSpending top={summary.topSpending} styles={styles} />

        {/* ── Category breakdown ─────────────────────────────────────────── */}
        <CategoryBreakdown
          byCategory={summary.byCategory}
          onSelect={(cat) => setActiveCategory(cat)}
        />

        <Text style={styles.footer}> &nbsp;</Text>
      </Screen>

      {/* Category overlay — outside ScrollView so FlatList is safe ───────── */}
      <CategoryOverlay
        category={activeCategory}
        items={categoryItems}
        month={month}
        year={year}
        onClose={() => setActiveCategory(null)}
      />
    </>
  );
}

// ─── Recent Transactions ─────────────────────────────────────────────────────
// Rendered with .map() (not FlatList) so it stays inside the Screen ScrollView
// without triggering nested-VirtualizedList warnings.

function RecentTransactions({ items, deletingId, onEdit, onDelete }) {
  return (
    <>
      <Text style={styles.section}>Recent transactions</Text>
      {items.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No transactions this month yet.</Text>
        </Card>
      ) : (
        <Card padded={false}>
          {items.map((item, i) => {
            const isCredit = item.type === 'Credit';
            const meta     = CATEGORY_META[item.category] || {};
            const isDeleting = deletingId === item.id;
            return (
              <View key={item.id}>
                {i > 0 && <View style={styles.rowSep} />}
                <View style={styles.recentRow}>
                  {/* Category icon */}
                  <View style={[styles.recentIcon, { backgroundColor: (meta.color || colors.primary) + '1A' }]}>
                    <Ionicons
                      name={meta.icon || 'pricetag-outline'}
                      size={18}
                      color={meta.color || colors.primary}
                    />
                  </View>

                  {/* Details + meta */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {item.details || '—'}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {item.date} · {item.category}
                    </Text>
                  </View>

                  {/* Amount */}
                  <Text style={[styles.recentAmount, { color: isCredit ? colors.success : colors.danger }]}>
                    {isCredit ? '+' : '-'}{inr(item.amount)}
                  </Text>

                  {/* Edit button */}
                  <TouchableOpacity
                    onPress={() => onEdit(item)}
                    style={styles.actionBtn}
                    hitSlop={8}
                    disabled={isDeleting}
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>

                  {/* Delete button */}
                  <TouchableOpacity
                    onPress={() => onDelete(item)}
                    style={[styles.actionBtn, { marginLeft: 2 }]}
                    hitSlop={8}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? <ActivityIndicator size="small" color={colors.danger} />
                      : <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    }
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

// ─── Category Breakdown ───────────────────────────────────────────────────────

function CategoryBreakdown({ byCategory, onSelect }) {
  const rows = Object.entries(byCategory || {}).filter(([, v]) => v.credit !== 0 || v.debit !== 0);
  return (
    <>
      <Text style={styles.section}>Category breakdown</Text>
      {rows.length === 0 ? (
        <Card><Text style={styles.empty}>No data yet.</Text></Card>
      ) : (
        <Card padded={false} style={{ paddingVertical: spacing.sm }}>
          {rows.map(([cat, v], i) => {
            const meta = CATEGORY_META[cat] || {};
            const net  = v.credit - v.debit;
            return (
              <Pressable
                key={cat}
                onPress={() => onSelect(cat)}
                style={({ pressed }) => pressed && { opacity: 0.7 }}
              >
                <View style={[styles.catBreakRow, i > 0 && styles.divider]}>
                  <View style={[styles.catIcon, { backgroundColor: (meta.color || colors.primary) + '22' }]}>
                    <Ionicons name={meta.icon || 'pricetag-outline'} size={18} color={meta.color || colors.primary} />
                  </View>

                  <Text style={[styles.dataRowLabel, { flex: 1 }]}>{cat}</Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[
                      styles.netPill,
                      { backgroundColor: (net >= 0 ? colors.success : colors.danger) + '18' },
                    ]}>
                      <Text style={[styles.netPillText, { color: net >= 0 ? colors.success : colors.danger }]}>
                        {net >= 0 ? '+' : ''}{inr(net)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Card>
      )}
      <Text style={styles.footer}>&nbsp;</Text>
      <Text style={styles.footer}>&nbsp;</Text>
    </>
  );
}

// ─── Category Overlay ─────────────────────────────────────────────────────────
// Rendered as a Modal so FlatList is never nested inside the Dashboard ScrollView.

function CategoryOverlay({ category, items, month, year, onClose }) {
  const insets      = useSafeAreaInsets();
  const slideAnim   = useRef(new Animated.Value(400)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const visible     = !!category;
  const meta        = CATEGORY_META[category] || {};
  const lastVisible = useRef(false);

  if (visible !== lastVisible.current) {
    lastVisible.current = visible;
    if (visible) {
      slideAnim.setValue(400);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 68, friction: 11 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 240, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }

  const credit = items.filter(e => e.type === 'Credit').reduce((s, e) => s + e.amount, 0);
  const debit  = items.filter(e => e.type === 'Debit').reduce((s,  e) => s + e.amount, 0);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          overlayStyles.sheet,
          { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={overlayStyles.handle} />

        <View style={overlayStyles.header}>
          <View style={[overlayStyles.catIcon, { backgroundColor: (meta.color || colors.primary) + '22' }]}>
            <Ionicons name={meta.icon || 'pricetag-outline'} size={22} color={meta.color || colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={overlayStyles.title}>{category}</Text>
            <Text style={overlayStyles.subtitle}>{MONTH_NAMES[(month || 1) - 1]} {year}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={overlayStyles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={overlayStyles.summaryRow}>
          <SummaryChip label="Credit" value={inr(credit)} color={colors.success} />
          <SummaryChip label="Debit"  value={inr(debit)}  color={colors.danger} />
          <SummaryChip label="Net" value={inr(credit - debit)} color={credit - debit >= 0 ? colors.success : colors.danger} />
        </View>

        <View style={overlayStyles.divider} />

        {items.length === 0 ? (
          <View style={overlayStyles.emptyWrap}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} style={{ marginBottom: spacing.sm }} />
            <Text style={overlayStyles.emptyText}>No transactions for this category this month.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}
            ItemSeparatorComponent={() => <View style={overlayStyles.rowDivider} />}
            renderItem={({ item }) => {
              const isCredit = item.type === 'Credit';
              return (
                <View style={overlayStyles.txRow}>
                  <View style={[overlayStyles.txTypeDot, { backgroundColor: isCredit ? colors.success + '22' : colors.danger + '22' }]}>
                    <Ionicons
                      name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
                      size={14}
                      color={isCredit ? colors.success : colors.danger}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={overlayStyles.txTitle} numberOfLines={1}>{item.details || '—'}</Text>
                    <Text style={overlayStyles.txMeta}>{item.date} · {item.mode}</Text>
                  </View>
                  <Text style={[overlayStyles.txAmount, { color: isCredit ? colors.success : colors.danger }]}>
                    {isCredit ? '+' : '-'}{inr(item.amount)}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </Animated.View>
    </Modal>
  );
}

function SummaryChip({ label, value, color }) {
  return (
    <View style={overlayStyles.chip}>
      <Text style={[overlayStyles.chipValue, { color }]}>{value}</Text>
      <Text style={overlayStyles.chipLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row:     { flexDirection: 'row', marginTop: spacing.md },
  section: {
    ...typography.title3,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  // Recent transaction row
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  recentIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  recentTitle:  { ...typography.body, color: colors.text },
  recentMeta:   { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  recentAmount: { ...typography.subhead, fontWeight: '600', flexShrink: 0 },
  actionBtn: {
    width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  // Category breakdown row
  catBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  catIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  dataRowLabel: { ...typography.body, color: colors.text },
  netPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  netPillText: { ...typography.footnote, fontWeight: '700' },

  // Used as a style modifier applied directly onto a row View
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  // Used as a standalone <View /> separator between Recent Transaction rows
  rowSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.lg + 36 + spacing.sm, // aligns under the text, past icon
  },

  // Shared across TopSpending (passed as prop)
  sectionHeader: { ...typography.title3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  catRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  catRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  txRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  txTitle:       { ...typography.body, color: colors.text },
  txSub:         { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
  dataRowSub:    { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
  txAmount:      { ...typography.headline },
  dataRowAmount: { ...typography.headline },
  footer: { marginTop: spacing.xl, marginBottom: spacing.sm },
});

const overlayStyles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '78%',
    ...shadows.raised,
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.separator,
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md,
  },
  catIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title:    { ...typography.title3, color: colors.text },
  subtitle: { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  chip:      { alignItems: 'center', flex: 1 },
  chipValue: { ...typography.headline, fontWeight: '700' },
  chipLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  divider:   { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginHorizontal: spacing.lg, marginBottom: spacing.xs },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyText: { ...typography.subhead, color: colors.textMuted, textAlign: 'center' },
  txRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  txTypeDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txTitle:   { ...typography.body, color: colors.text },
  txMeta:    { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
  txAmount:  { ...typography.headline, fontWeight: '600' },
  rowDivider:{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
});
