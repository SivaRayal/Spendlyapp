import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, spacing } from '../theme';
import { inr } from '../theme/format';
import { CATEGORY_META } from '../theme';

export default function TopSpending({ top, styles }) {
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
                <Text style={[styles.dataRowAmount, { color: colors.danger }]}>-{inr(e.amount)}</Text>
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}
