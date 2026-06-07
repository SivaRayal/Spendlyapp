import { useCallback, useState, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable,
  Modal, FlatList, TouchableOpacity, Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Screen from "../components/Screen";
import Card from "../components/Card";
import SegmentedControl from "../components/SegmentedControl";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { listMonth, listYear, summarize } from "../db/excelDb";
import { inr, MONTH_NAMES, MONTH_SHORT } from "../theme/format";
import { spacing, typography, radius, CATEGORY_META, shadows } from "../theme";

export default function ReportsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const now = new Date();
  const [mode, setMode]   = useState("monthly");
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (mode === "monthly") {
        const expenses = await listMonth(user.id, year, month);
        setData({ kind: "monthly", summary: summarize(expenses), expenses });
      } else {
        const expenses = await listYear(user.id, year);
        const monthly = {};
        for (let m = 1; m <= 12; m++) monthly[m] = { credit: 0, debit: 0 };
        for (const e of expenses) {
          const m = Number(e.date.slice(5, 7));
          if (e.type === "Credit") monthly[m].credit += Number(e.amount);
          else if (e.type === "Debit") monthly[m].debit += Number(e.amount);
        }
        setData({ kind: "yearly", summary: summarize(expenses), monthly });
      }
    } finally {
      setLoading(false);
    }
  }, [user, mode, year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const categoryItems = activeCategory && data?.expenses
    ? data.expenses.filter((e) => e.category === activeCategory)
    : [];

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <Screen title="Reports" subtitle="Insights into your spending">
        <SegmentedControl
          options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]}
          value={mode}
          onChange={setMode}
          style={{ marginBottom: spacing.lg }}
        />

        <View style={styles.periodCard}>
          <Pressable onPress={() => shiftYear(-1, year, setYear)} style={styles.arrow}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.periodLabel}>
            {mode === "monthly" ? `${MONTH_NAMES[month - 1]} ${year}` : `Year ${year}`}
          </Text>
          <Pressable onPress={() => shiftYear(1, year, setYear)} style={styles.arrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {mode === "monthly" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.sm }}>
            {MONTH_SHORT.map((mn, i) => {
              const m = i + 1;
              const selected = m === month;
              return (
                <Pressable key={mn} onPress={() => setMonth(m)} style={[styles.monthPill, selected && styles.monthPillActive]}>
                  <Text style={[styles.monthPillText, selected && styles.monthPillTextActive]}>{mn}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {loading || !data ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <>
            <View style={styles.row}>
              <StatCard label="Credit" value={inr(data.summary.totalCredit)} icon="arrow-down-circle-outline" />
              <View style={{ width: spacing.md }} />
              <StatCard label="Debit"  value={inr(data.summary.totalDebit)}  icon="arrow-up-circle-outline" />
            </View>
            <View style={styles.row}>
              <StatCard label="Net"     value={inr(data.summary.net)}          icon={data.summary.net >= 0 ? "trending-up" : "trending-down"} />
              <View style={{ width: spacing.md }} />
              <StatCard label="Entries" value={String(data.summary.count)}     icon="layers-outline" />
            </View>

            {data.kind === "monthly" && (
              <CategoryBreakdown byCategory={data.summary.byCategory} onSelect={(cat) => setActiveCategory(cat)} styles={styles} colors={colors} />
            )}

            {data.kind === "monthly" && (
              <>
                <Text style={styles.section}>{`${year}-${MONTH_NAMES[month - 1]} activity`}</Text>
                {!data.expenses || data.expenses.length === 0 ? (
                  <Card><Text style={styles.empty}>No transactions yet this month. Tap the + tab to add one.</Text></Card>
                ) : (
                  <Card padded={false} style={{ paddingVertical: spacing.sm }}>
                    {[...data.expenses].reverse().map((e, i) => {
                      const meta = CATEGORY_META[e.category] || {};
                      const isCredit = e.type === "Credit";
                      return (
                        <Pressable key={e.id} onPress={() => navigation.navigate("Add", { expense: e })}>
                          <View style={[styles.txRow, i > 0 && styles.divider]}>
                            <View style={[styles.catIcon, { backgroundColor: (meta.color || colors.primary) + "22" }]}>
                              <Ionicons name={meta.icon || "pricetag-outline"} size={18} color={meta.color || colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.txTitle} numberOfLines={1}>{e.details}</Text>
                              <Text style={styles.dataRowSub}>{e.category} · {e.date}</Text>
                            </View>
                            <Text style={[styles.dataRowAmount, { color: isCredit ? colors.success : colors.danger }]}>
                              {isCredit ? "+" : "-"}{inr(e.amount)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </Card>
                )}
              </>
            )}

            {data.kind === "yearly" && <MonthlyBreakdown monthly={data.monthly} styles={styles} colors={colors} />}
          </>
        )}
        <Text style={styles.footer}>&nbsp;</Text>
        <Text style={styles.footer}>&nbsp;</Text>
        <Text style={styles.footer}>&nbsp;</Text>
      </Screen>

      <CategoryOverlay
        category={activeCategory}
        items={categoryItems}
        month={month}
        year={year}
        onClose={() => setActiveCategory(null)}
        colors={colors}
      />
    </>
  );
}

function shiftYear(delta, year, setYear) { setYear(year + delta); }

function MonthlyBreakdown({ monthly, styles, colors }) {
  return (
    <>
      <Text style={styles.section}>Monthly breakdown</Text>
      <Card padded={false} style={{ paddingVertical: spacing.sm }}>
        {Object.entries(monthly).map(([m, v], i) => {
          const net = v.credit - v.debit;
          return (
            <View key={m} style={[styles.dataRow, i > 0 && styles.divider]}>
              <Text style={styles.dataRowLabel}>{MONTH_NAMES[Number(m) - 1]}</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.dataRowAmount, { color: net >= 0 ? colors.success : colors.danger }]}>{inr(net)}</Text>
                <Text style={styles.dataRowSub}>+{inr(v.credit)} · -{inr(v.debit)}</Text>
              </View>
            </View>
          );
        })}
      </Card>
    </>
  );
}

function CategoryBreakdown({ byCategory, onSelect, styles, colors }) {
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
            const net = v.credit - v.debit;
            return (
              <Pressable key={cat} onPress={() => onSelect(cat)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <View style={[styles.catBreakRow, i > 0 && styles.divider]}>
                  <View style={[styles.catIcon, { backgroundColor: (meta.color || colors.primary) + "22" }]}>
                    <Ionicons name={meta.icon || "pricetag-outline"} size={18} color={meta.color || colors.primary} />
                  </View>
                  <Text style={[styles.dataRowLabel, { flex: 1 }]}>{cat}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={[styles.netPill, { backgroundColor: (net >= 0 ? colors.success : colors.danger) + "18" }]}>
                      <Text style={[styles.netPillText, { color: net >= 0 ? colors.success : colors.danger }]}>
                        {net >= 0 ? "+" : ""}{inr(net)}
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
    </>
  );
}

function CategoryOverlay({ category, items, month, year, onClose, colors }) {
  const insets    = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const visible   = !!category;
  const meta      = CATEGORY_META[category] || {};
  const lastVisible = useRef(false);
  const overlayStyles = useMemo(() => makeOverlayStyles(colors), [colors]);

  if (visible !== lastVisible.current) {
    lastVisible.current = visible;
    if (visible) {
      slideAnim.setValue(400);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 68, friction: 11 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 240, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }

  const credit = items.filter((e) => e.type === "Credit").reduce((s, e) => s + e.amount, 0);
  const debit  = items.filter((e) => e.type === "Debit").reduce((s, e) => s + e.amount, 0);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[overlayStyles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={overlayStyles.handle} />
        <View style={overlayStyles.header}>
          <View style={[overlayStyles.catIcon, { backgroundColor: (meta.color || colors.primary) + "22" }]}>
            <Ionicons name={meta.icon || "pricetag-outline"} size={22} color={meta.color || colors.primary} />
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
          {[["Credit", inr(credit), colors.success], ["Debit", inr(debit), colors.danger], ["Net", inr(credit - debit), credit - debit >= 0 ? colors.success : colors.danger]].map(([label, value, color]) => (
            <View key={label} style={overlayStyles.chip}>
              <Text style={[overlayStyles.chipValue, { color }]}>{value}</Text>
              <Text style={overlayStyles.chipLabel}>{label}</Text>
            </View>
          ))}
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
              const isCredit = item.type === "Credit";
              return (
                <View style={overlayStyles.txRow}>
                  <View style={[overlayStyles.txTypeDot, { backgroundColor: isCredit ? colors.success + "22" : colors.danger + "22" }]}>
                    <Ionicons name={isCredit ? "arrow-down-outline" : "arrow-up-outline"} size={14} color={isCredit ? colors.success : colors.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={overlayStyles.txTitle} numberOfLines={1}>{item.details || "—"}</Text>
                    <Text style={overlayStyles.txMeta}>{item.date} · {item.mode}</Text>
                  </View>
                  <Text style={[overlayStyles.txAmount, { color: isCredit ? colors.success : colors.danger }]}>
                    {isCredit ? "+" : "-"}{inr(item.amount)}
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

function makeStyles(colors) {
  return StyleSheet.create({
    row:       { flexDirection: "row", marginTop: spacing.md },
    center:    { padding: spacing.xl, alignItems: "center" },
    section:   { ...typography.title3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
    periodCard:{
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderRadius: radius.md, marginBottom: spacing.sm,
    },
    arrow:       { padding: 8 },
    periodLabel: { ...typography.headline, color: colors.text },
    monthPill:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.inputBg, marginRight: 8 },
    monthPillActive: { backgroundColor: colors.primary },
    monthPillText:   { ...typography.subhead, color: colors.textSecondary, fontWeight: "500" },
    monthPillTextActive: { color: colors.white, fontWeight: "600" },
    empty:       { ...typography.body, color: colors.textMuted, textAlign: "center" },
    catIcon:     { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    dataRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    catBreakRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    netPill:     { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 999 },
    netPillText: { ...typography.footnote, fontWeight: "700" },
    txRow:       { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    divider:     { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
    dataRowLabel:  { ...typography.body,     color: colors.text },
    dataRowSub:    { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
    dataRowAmount: { ...typography.headline },
    txTitle:       { ...typography.body,     color: colors.text },
    footer: { marginTop: spacing.xl, marginBottom: spacing.sm },
  });
}

function makeOverlayStyles(colors) {
  return StyleSheet.create({
    backdrop: { backgroundColor: "rgba(0,0,0,0.55)" },
    sheet: {
      position: "absolute", left: 0, right: 0, bottom: 0,
      backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      maxHeight: "78%", ...shadows.raised,
    },
    handle:   { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.separator, marginTop: spacing.sm, marginBottom: spacing.xs },
    header:   { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
    catIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    title:    { ...typography.title3,   color: colors.text },
    subtitle: { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" },
    summaryRow:  { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    chip:        { alignItems: "center", flex: 1 },
    chipValue:   { ...typography.headline, fontWeight: "700" },
    chipLabel:   { ...typography.caption,  color: colors.textMuted, marginTop: 2 },
    divider:     { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginHorizontal: spacing.lg, marginBottom: spacing.xs },
    emptyWrap:   { alignItems: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
    emptyText:   { ...typography.subhead, color: colors.textMuted, textAlign: "center" },
    txRow:       { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, gap: spacing.md },
    txTypeDot:   { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    txTitle:     { ...typography.body,     color: colors.text },
    txMeta:      { ...typography.footnote, color: colors.textMuted, marginTop: 2 },
    txAmount:    { ...typography.headline, fontWeight: "600" },
    rowDivider:  { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  });
}
