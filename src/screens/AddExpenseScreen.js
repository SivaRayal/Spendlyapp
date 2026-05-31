import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import SegmentedControl from '../components/SegmentedControl';
import Chip from '../components/Chip';
import { useAuth } from '../context/AuthContext';
import { addExpense, CATEGORIES, TRANSACTION_TYPES, MODES } from '../db/excelDb';
import { todayISO, inr } from '../theme/format';
import DatePicker from '../components/DatePicker';
import { colors, spacing, typography, radius, CATEGORY_META } from '../theme';

export default function AddExpenseScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route?.params?.expense ? true : false;
  const [form, setForm] = useState({
    date: todayISO(),
    details: '',
    type: 'Debit',
    mode: 'UPI',
    amount: '',
    category: 'Bill',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing) {
      const e = route.params.expense;
      setForm({
        date: e.date || todayISO(),
        details: e.details || '',
        type: e.type || 'Debit',
        mode: e.mode || 'UPI',
        amount: String(e.amount || ''),
        category: e.category || 'Bill',
      });
    }
  }, [editing, route]);

  function set(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function handleSave() {
    if (!form.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return Alert.alert('Invalid date', 'Date must be in YYYY-MM-DD format.');
    }
    const amt = Number(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return Alert.alert('Invalid amount', 'Enter an amount greater than zero.');
    }
    if (!form.details.trim()) {
      return Alert.alert('Missing details', 'Add a short description.');
    }

    setBusy(true);
    try {
      if (editing) {
        const id = route.params.expense.id;
        const { updateExpense } = await import('../db/excelDb');
        await updateExpense(user.id, id, { ...form, amount: amt });
        Alert.alert('Updated', 'Expense updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addExpense(user.id, { ...form, amount: amt });
        Alert.alert(
          'Saved',
          'Expense added to your monthly sheet.',
          [
            { text: 'Add another', onPress: () => setForm({ ...form, details: '', amount: '' }), style: 'cancel' },
            { text: 'View dashboard', onPress: () => navigation.navigate('Home') },
          ],
        );
      }
    } catch (err) {
      Alert.alert('Could not save', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete', 'Delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          const { deleteExpense } = await import('../db/excelDb');
          await deleteExpense(user.id, route.params.expense.id);
          Alert.alert('Deleted', 'Transaction removed.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (err) {
          Alert.alert('Could not delete', err.message);
        } finally {
          setBusy(false);
        }
      } },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <Screen title="Add Expense" subtitle="Capture a new transaction">
        <Card>
          <Text style={styles.fieldLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextField
              value={form.amount}
              onChangeText={(v) => set('amount', v.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              keyboardType="decimal-pad"
              style={{ flex: 1, marginBottom: 0 }}
            />
          </View>
          {form.amount ? (
            <Text style={styles.amountHint}>{inr(form.amount)}</Text>
          ) : null}
        </Card>

        <Text style={styles.section}>Transaction type</Text>
        <SegmentedControl
          options={TRANSACTION_TYPES.map((t) => ({ value: t, label: t }))}
          value={form.type}
          onChange={(v) => set('type', v)}
        />

        <Text style={styles.section}>Payment mode</Text>
        <SegmentedControl
          options={MODES.map((m) => ({ value: m, label: m }))}
          value={form.mode}
          onChange={(v) => set('mode', v)}
        />

        <Text style={styles.section}>Category</Text>
        <View style={styles.chipsWrap}>
          {CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c] || {};
            return (
              <Chip
                key={c}
                label={c}
                icon={meta.icon}
                color={meta.color}
                selected={form.category === c}
                onPress={() => set('category', c)}
              />
            );
          })}
        </View>

        <Text style={styles.section}>Details</Text>
        <Card padded style={{ marginTop: 0 }}>
          <TextField
            value={form.details}
            onChangeText={(v) => set('details', v)}
            placeholder="e.g. Groceries at supermarket"
            style={{ marginBottom: spacing.md }}
          />
          <DatePicker
            label="Date"
            value={form.date}
            onChange={(v) => set('date', v)}
          />
        </Card>

        <View style={{ height: spacing.xl }} />
        <PrimaryButton
          title={busy ? (editing ? 'Updating…' : 'Saving…') : (editing ? 'Update expense' : 'Save expense')}
          icon="checkmark-circle"
          onPress={handleSave}
          loading={busy}
        />
        {editing ? (
          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton
              title="Delete"
              icon="trash"
              onPress={handleDelete}
              color="danger"
              loading={busy}
            />
          </View>
        ) : null}
        <Text style={styles.footer}>&nbsp;</Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...typography.subhead,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    ...typography.largeTitle,
    color: colors.text,
    marginRight: spacing.sm,
  },
  amountHint: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    ...typography.subhead,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: { marginTop: spacing.xl, marginBottom: spacing.sm, alignItems: 'center', justifyContent: 'center' },
});
