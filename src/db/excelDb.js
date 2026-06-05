import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { expensesFileFor, ensureDataDir } from './paths';

export const CATEGORIES = [
  'Income', 'Bill', 'Groceries', 'Investment', 'Medical',
  'Payment', 'Shopping', 'Travel', 'Unplanned',
];

export const TRANSACTION_TYPES = ['Credit', 'Debit'];
export const MODES = ['Bank', 'UPI'];

const HEADER_ROW = ['Id', 'Date', 'Details', 'Transaction Type', 'Mode', 'Amount (INR)', 'Category'];

function monthKeyFromDate(dateStr) {
  return dateStr.slice(0, 7); // YYYY-MM
}

async function loadWorkbook(userId) {
  await ensureDataDir();
  const path = expensesFileFor(userId);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return XLSX.utils.book_new();
  const b64 = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return XLSX.read(b64, { type: 'base64' });
}

async function saveWorkbook(userId, wb) {
  await ensureDataDir();
  const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  await FileSystem.writeAsStringAsync(expensesFileFor(userId), b64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

function extractExpenses(sheet) {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) break;
    if (!r[0] || String(r[0]).trim() === '') break;
    out.push({
      id: String(r[0]),
      date: String(r[1] || ''),
      details: String(r[2] || ''),
      type: String(r[3] || ''),
      mode: String(r[4] || ''),
      amount: Number(r[5]) || 0,
      category: String(r[6] || ''),
    });
  }
  return out;
}

function buildSheet(expenses) {
  const rows = [HEADER_ROW];
  for (const e of expenses) {
    rows.push([e.id, e.date, e.details, e.type, e.mode, e.amount, e.category]);
  }
  rows.push([]);
  rows.push([]);

  const totalCredit = expenses
    .filter(e => e.type === 'Credit')
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalDebit = expenses
    .filter(e => e.type === 'Debit')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  rows.push(['Summary']);
  rows.push(['Total Credit (INR)', totalCredit]);
  rows.push(['Total Debit (INR)', totalDebit]);
  rows.push(['Net (Credit - Debit)', totalCredit - totalDebit]);
  rows.push([]);

  rows.push(['Category Breakdown']);
  rows.push(['Category', 'Credit (INR)', 'Debit (INR)', 'Net (INR)']);
  for (const cat of CATEGORIES) {
    const credit = expenses
      .filter(e => e.category === cat && e.type === 'Credit')
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const debit = expenses
      .filter(e => e.category === cat && e.type === 'Debit')
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    if (credit === 0 && debit === 0) continue;
    rows.push([cat, credit, debit, credit - debit]);
  }
  rows.push([]);

  rows.push(['Top 5 Spending (Debit)']);
  rows.push(['Date', 'Details', 'Category', 'Mode', 'Amount (INR)']);
  const topDebits = expenses
    .filter(e => e.type === 'Debit')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);
  for (const e of topDebits) {
    rows.push([e.date, e.details, e.category, e.mode, e.amount]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 14 },
    { wch: 8 }, { wch: 14 }, { wch: 14 },
  ];
  return sheet;
}

function upsertSheet(wb, sheetName, expenses) {
  const sheet = buildSheet(expenses);
  if (wb.SheetNames.includes(sheetName)) {
    wb.Sheets[sheetName] = sheet;
  } else {
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  }
  wb.SheetNames.sort();
}

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function addExpense(userId, expense) {
  const wb = await loadWorkbook(userId);
  const sheetName = monthKeyFromDate(expense.date);
  const existing = wb.SheetNames.includes(sheetName)
    ? extractExpenses(wb.Sheets[sheetName])
    : [];
  const record = {
    id: nextId(),
    date: expense.date,
    details: expense.details,
    type: expense.type,
    mode: expense.mode,
    amount: Number(expense.amount),
    category: expense.category,
  };
  existing.push(record);
  existing.sort((a, b) => a.date.localeCompare(b.date));
  upsertSheet(wb, sheetName, existing);
  await saveWorkbook(userId, wb);
  return record;
}

export async function updateExpense(userId, id, patch) {
  const wb = await loadWorkbook(userId);
  let found = null;
  let foundSheet = null;
  for (const name of wb.SheetNames) {
    const expenses = extractExpenses(wb.Sheets[name]);
    const idx = expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      found = { ...expenses[idx] };
      foundSheet = name;
      // apply patch
      const updated = { ...expenses[idx], ...patch };
      // remove from this sheet
      expenses.splice(idx, 1);
      // if date month changed, will re-insert below
      // otherwise insert back into same sheet
      const newSheetName = monthKeyFromDate(updated.date || found.date);
      if (newSheetName === name) {
        expenses.push(updated);
        expenses.sort((a, b) => a.date.localeCompare(b.date));
        upsertSheet(wb, name, expenses);
      } else {
        // update this sheet (without the record)
        upsertSheet(wb, name, expenses);
        // insert into target sheet
        const target = wb.SheetNames.includes(newSheetName) ? extractExpenses(wb.Sheets[newSheetName]) : [];
        target.push(updated);
        target.sort((a, b) => a.date.localeCompare(b.date));
        upsertSheet(wb, newSheetName, target);
      }
      await saveWorkbook(userId, wb);
      return updated;
    }
  }
  throw new Error('Expense not found');
}

export async function deleteExpense(userId, id) {
  const wb = await loadWorkbook(userId);
  for (const name of [...wb.SheetNames]) {
    const expenses = extractExpenses(wb.Sheets[name]);
    const idx = expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      expenses.splice(idx, 1);
      upsertSheet(wb, name, expenses);
      await saveWorkbook(userId, wb);
      return true;
    }
  }
  return false;
}

export async function listMonth(userId, year, month) {
  const wb = await loadWorkbook(userId);
  const sheetName = `${year}-${String(month).padStart(2, '0')}`;
  if (!wb.SheetNames.includes(sheetName)) return [];
  return extractExpenses(wb.Sheets[sheetName]);
}

export async function listYear(userId, year) {
  const wb = await loadWorkbook(userId);
  const out = [];
  for (const name of wb.SheetNames) {
    if (name.startsWith(`${year}-`)) {
      out.push(...extractExpenses(wb.Sheets[name]));
    }
  }
  return out;
}

export async function listAll(userId) {
  const wb = await loadWorkbook(userId);
  const out = [];
  for (const name of wb.SheetNames) {
    out.push(...extractExpenses(wb.Sheets[name]));
  }
  return out;
}

export function summarize(expenses) {
  const totalCredit = expenses
    .filter(e => e.type === 'Credit')
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalDebit = expenses
    .filter(e => e.type === 'Debit')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const byCategory = {};
  for (const cat of CATEGORIES) {
    const credit = expenses
      .filter(e => e.category === cat && e.type === 'Credit')
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const debit = expenses
      .filter(e => e.category === cat && e.type === 'Debit')
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    byCategory[cat] = { credit, debit, net: credit - debit };
  }

  const topSpending = expenses
    .filter(e => e.type === 'Debit')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);

  return {
    totalCredit,
    totalDebit,
    net: totalCredit - totalDebit,
    byCategory,
    topSpending,
    count: expenses.length,
  };
}

export function getExpensesFilePath(userId) {
  return expensesFileFor(userId);
}

const MONTH_SHEET_REGEX = /^\d{4}-\d{2}$/;
// Spendly stores dates as YYYY-MM-DD strings.
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function importFromExcel(userId, fileUri) {
  // ── 1. Read source file ────────────────────────────────────────────────────
  // On Android the DocumentPicker URI (content:// or a sandboxed file://) is
  // outside the app's readable scope, so FileSystem.readAsStringAsync rejects
  // it directly.  The reliable fix is to copy the file into the app's own
  // cache directory first, read from there, then delete the temp copy.
  await ensureDataDir();
  const tmpPath = FileSystem.cacheDirectory + 'spendly_import_tmp_' + Date.now() + '.xlsx';

  try {
    await FileSystem.copyAsync({ from: fileUri, to: tmpPath });
  } catch (copyErr) {
    throw new Error(
      'Could not access the selected file. On some devices you may need to ' +
      'choose the file from the Downloads folder rather than from a cloud ' +
      'provider.\n\nDetail: ' + copyErr.message,
    );
  }

  let b64;
  try {
    b64 = await FileSystem.readAsStringAsync(tmpPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    throw new Error(
      'Could not read the selected file after copying it locally. ' +
      'Make sure the file is not corrupted.\n\nDetail: ' + err.message,
    );
  } finally {
    // Always clean up the temp copy, even if the read failed
    FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
  }

  // ── 2. Parse workbook ──────────────────────────────────────────────────────
  let srcWb;
  try {
    srcWb = XLSX.read(b64, { type: 'base64' });
  } catch (err) {
    throw new Error(
      'The file could not be parsed as a valid Excel workbook. ' +
      'Please use a Spendly-exported .xlsx file.',
    );
  }

  // ── 3. Find YYYY-MM month sheets ───────────────────────────────────────────
  const monthSheets = srcWb.SheetNames.filter(n => MONTH_SHEET_REGEX.test(n));
  if (monthSheets.length === 0) {
    throw new Error(
      'No monthly sheets (YYYY-MM) found in this workbook. ' +
      'Only Spendly-format files with month sheets can be imported.',
    );
  }

  // ── 4. Extract transactions from each month sheet ──────────────────────────
  const toImport = []; // { sheetName, expenses[] }  — only sheets with data
  let skipped = 0;     // actual transaction rows that failed field validation

  for (const sheetName of monthSheets) {
    const sheet = srcWb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Need at least a header row + one data row
    if (!rows || rows.length < 2) continue;

    // ── 4a. Validate that the required Spendly header columns are present ────
    const header = rows[0].map(h => String(h).trim());
    const missingHeaders = HEADER_ROW.filter(h => !header.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(
        `Sheet "${sheetName}" is missing required columns: ${missingHeaders.join(', ')}.\n\n` +
        'Only Spendly-format files are supported.',
      );
    }

    // ── 4b. Build a name→index map (robust to column reordering) ─────────────
    const colIdx = {};
    HEADER_ROW.forEach(h => { colIdx[h] = header.indexOf(h); });

    // ── 4c. Read transaction rows — STOP at first blank row ───────────────────
    //   This mirrors extractExpenses() exactly: transactions are a contiguous
    //   block at the top of the sheet, followed by blank rows then the summary
    //   section.  Stopping at the first blank row means we never accidentally
    //   parse summary/breakdown/top-5 rows as transactions, and the skipped
    //   counter stays accurate.
    const expenses = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];

      // Empty row → end of the transaction block (summary section follows)
      if (!r || r.length === 0) break;
      const idVal = String(r[colIdx['Id']] ?? '').trim();
      if (!idVal) break; // first cell empty → separator row

      // Validate required fields: date (YYYY-MM-DD) and transaction type
      const dateVal = String(r[colIdx['Date']] ?? '').trim();
      const typeVal = String(r[colIdx['Transaction Type']] ?? '').trim();

      if (!DATE_REGEX.test(dateVal) || !TRANSACTION_TYPES.includes(typeVal)) {
        // This is a genuine transaction row that has bad data — count it
        skipped++;
        continue;
      }

      const modeVal    = String(r[colIdx['Mode']] ?? '').trim();
      const catVal     = String(r[colIdx['Category']] ?? '').trim();
      const detailsVal = String(r[colIdx['Details']] ?? '').trim();
      const amountRaw  = r[colIdx['Amount (INR)']];
      const amountVal  = Number(amountRaw);

      expenses.push({
        id:       idVal,
        date:     dateVal,
        details:  detailsVal,
        type:     typeVal,
        mode:     MODES.includes(modeVal) ? modeVal : 'UPI',
        amount:   Number.isFinite(amountVal) ? amountVal : 0,
        category: CATEGORIES.includes(catVal) ? catVal : 'Unplanned',
      });
    }

    // Only queue sheets that actually contain transactions.
    // Skipping empty sheets prevents accidentally wiping an existing month's
    // data in the destination workbook with an empty replacement.
    if (expenses.length > 0) {
      toImport.push({ sheetName, expenses });
    }
  }

  // ── 5. Guard: nothing importable found ────────────────────────────────────
  if (toImport.length === 0) {
    throw new Error(
      'No importable transactions were found in this workbook.\n\n' +
      'Make sure you are importing a Spendly-exported .xlsx file that ' +
      'contains at least one monthly sheet with transaction data.',
    );
  }

  // ── 6. Merge into the user's local workbook ────────────────────────────────
  //   Each month present in the source replaces the same month in the
  //   destination.  Months not present in the source are left untouched.
  const destWb = await loadWorkbook(userId);
  let totalImported = 0;

  for (const { sheetName, expenses } of toImport) {
    upsertSheet(destWb, sheetName, expenses);
    totalImported += expenses.length;
  }

  await saveWorkbook(userId, destWb);

  return {
    imported: totalImported,
    skipped,
    months: toImport.length,
  };
}
