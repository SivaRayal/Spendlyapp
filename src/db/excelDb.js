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
