import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { listMonth } from '../db/excelDb';
import { inr, MONTH_NAMES } from '../theme/format';
import { spacing, typography } from '../theme';

export default function CategoryScreen() {
  const route = useRoute();
  const { category } = route.params || {};
  const { user } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    if (!user || !category) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    try {
      const all = await listMonth(user.id, year, month);
      setItems(all.filter((e) => e.category === category));
    } catch {
      setItems([]);
    }
  }, [user, category]);

  useEffect(() => { load(); }, [load]);

  const dynamicStyles = useMemo(() => ({
    empty:  { ...typography.body,     color: colors.textMuted, textAlign: 'center' },
    title:  { ...typography.body,     color: colors.text },
    meta:   { ...typography.footnote, color: colors.textMuted, marginTop: 4 },
    amount: { ...typography.headline },
  }), [colors]);

  return (
    <Screen title={category ? `${category} — ${MONTH_NAMES[new Date().getMonth()]}` : 'Category'}>
      {items.length === 0 ? (
        <Card><Text style={dynamicStyles.empty}>No transactions for this category this month.</Text></Card>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.title}>{item.details || '—'}</Text>
                <Text style={dynamicStyles.meta}>{item.date} · {item.mode} · {item.type}</Text>
              </View>
              <Text style={[dynamicStyles.amount, { color: item.type === 'Credit' ? colors.success : colors.danger }]}>
                {inr(item.amount)}
              </Text>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
