import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Screen from '../components/Screen';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { importFromExcel } from '../db/excelDb';
import { colors, spacing, typography, radius, shadows } from '../theme';

const DISCLAIMER_POINTS = [
  {
    icon: 'document-text-outline',
    title: 'Spendly format only',
    body: 'The file must be a Spendly-exported Excel workbook (.xlsx). Each sheet must be named YYYY-MM and contain the standard Spendly columns.',
  },
  {
    icon: 'calendar-outline',
    title: 'Monthly sheets imported',
    body: 'Only sheets whose names match the YYYY-MM format are imported. Other sheets (e.g. summary tabs) are ignored.',
  },
  {
    icon: 'warning-outline',
    title: 'Existing data will be overridden',
    body: 'For every month present in the uploaded file, all existing transactions for that month in your local database will be replaced.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Local storage only',
    body: 'Your data stays on this device. Nothing is uploaded to any server.',
  },
];

const REQUIRED_HEADERS = ['Id', 'Date', 'Details', 'Transaction Type', 'Mode', 'Amount (INR)', 'Category'];

export default function ImportScreen() {
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState(null); // null | 'picking' | 'importing' | 'done' | 'error'
  const [result, setResult] = useState(null); // { imported, skipped, months }
  const [errorMsg, setErrorMsg] = useState('');

  async function handlePick() {
    if (!agreed) {
      Alert.alert('Please read the disclaimer', 'Tick the checkbox to confirm you understand the import rules.');
      return;
    }

    setStatus('picking');
    setResult(null);
    setErrorMsg('');

    let pickerResult;
    try {
      pickerResult = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });
    } catch (err) {
      setStatus('error');
      setErrorMsg('Could not open the file picker: ' + err.message);
      return;
    }

    if (pickerResult.canceled || !pickerResult.assets?.length) {
      setStatus(null);
      return;
    }

    const asset = pickerResult.assets[0];
    if (!asset.name?.toLowerCase().endsWith('.xlsx')) {
      setStatus('error');
      setErrorMsg('Only .xlsx files are supported. Please export your Spendly data first and then re-import.');
      return;
    }

    setStatus('importing');
    try {
      const summary = await importFromExcel(user.id, asset.uri);
      setResult(summary);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'An unexpected error occurred while importing.');
    }
  }

  function handleReset() {
    setStatus(null);
    setResult(null);
    setErrorMsg('');
    setAgreed(false);
  }

  const busy = status === 'picking' || status === 'importing';

  return (
    <Screen title="Import Data">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="cloud-upload-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Import Excel Workbook</Text>
          <Text style={styles.heroSub}>
            Restore or merge transactions from a previously exported Spendly Excel file.
          </Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.sectionLabel}>Before you continue</Text>
        <Card padded={false}>
          {DISCLAIMER_POINTS.map((pt, i) => (
            <View key={pt.icon}>
              <View style={styles.disclaimerRow}>
                <View style={[styles.disclaimerIconWrap, { backgroundColor: iconBg(i) }]}>
                  <Ionicons name={pt.icon} size={18} color={iconColor(i)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.disclaimerTitle}>{pt.title}</Text>
                  <Text style={styles.disclaimerBody}>{pt.body}</Text>
                </View>
              </View>
              {i < DISCLAIMER_POINTS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        {/* Required columns callout */}
        <View style={styles.columnsCard}>
          <Text style={styles.columnsLabel}>Required columns (row 1 of each sheet)</Text>
          <View style={styles.chipRow}>
            {REQUIRED_HEADERS.map(h => (
              <View key={h} style={styles.chip}>
                <Text style={styles.chipText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Agreement checkbox */}
        <Pressable style={styles.checkRow} onPress={() => setAgreed(v => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
          <Text style={styles.checkLabel}>
            I understand that existing monthly data will be overridden and that only Spendly-format files should be imported.
          </Text>
        </Pressable>

        {/* Action area */}
        {(status === null || status === 'picking' || status === 'importing') && (
          <PrimaryButton
            title={busy ? (status === 'picking' ? 'Opening picker…' : 'Importing…') : 'Choose Excel File'}
            icon={busy ? null : 'document-attach-outline'}
            loading={busy}
            onPress={handlePick}
          />
        )}

        {/* Success */}
        {status === 'done' && result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
              <Text style={styles.resultTitle}>Import complete</Text>
            </View>
            <View style={styles.statRow}>
              <Stat label="Transactions imported" value={result.imported} color={colors.success} />
              <Stat label="Rows skipped" value={result.skipped} color={colors.warning} />
              <Stat label="Months updated" value={result.months} color={colors.primary} />
            </View>
            <PrimaryButton
              title="Import another file"
              variant="secondary"
              icon="refresh-outline"
              onPress={handleReset}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {/* Error */}
        {status === 'error' && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color={colors.danger} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.errorTitle}>Import failed</Text>
            <Text style={styles.errorBody}>{errorMsg}</Text>
            <PrimaryButton
              title="Try again"
              variant="danger"
              icon="refresh-outline"
              onPress={() => { setStatus(null); setErrorMsg(''); }}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, color }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const ICON_PALETTES = [
  { bg: 'rgba(0,122,255,0.12)', fg: colors.primary },
  { bg: 'rgba(255,149,0,0.12)', fg: colors.warning },
  { bg: 'rgba(255,59,48,0.12)', fg: colors.danger },
  { bg: 'rgba(52,199,89,0.12)', fg: colors.success },
];
function iconBg(i) { return ICON_PALETTES[i % ICON_PALETTES.length].bg; }
function iconColor(i) { return ICON_PALETTES[i % ICON_PALETTES.length].fg; }

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { ...typography.title2, color: colors.text, marginBottom: spacing.xs },
  heroSub: { ...typography.subhead, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },

  sectionLabel: {
    ...typography.footnote,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  disclaimerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  disclaimerTitle: { ...typography.subhead, fontWeight: '600', color: colors.text, marginBottom: 2 },
  disclaimerBody: { ...typography.footnote, color: colors.textMuted, lineHeight: 18 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.lg + 36 + spacing.md,
  },

  columnsCard: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.card,
  },
  columnsLabel: { ...typography.footnote, color: colors.textMuted, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary },
  checkLabel: { ...typography.subhead, color: colors.text, flex: 1, lineHeight: 20 },

  resultCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
    marginTop: spacing.sm,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  resultTitle: { ...typography.headline, color: colors.text },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { ...typography.title2, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 2 },

  errorCard: {
    backgroundColor: 'rgba(255,59,48,0.06)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
    marginTop: spacing.sm,
  },
  errorTitle: { ...typography.headline, color: colors.danger, marginBottom: spacing.xs },
  errorBody: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
