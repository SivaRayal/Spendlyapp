import * as FileSystem from 'expo-file-system/legacy';

export const DATA_DIR = FileSystem.documentDirectory + 'expense-calculator/';
export const USERS_FILE = DATA_DIR + 'users.json';

export function expensesFileFor(userId) {
  return `${DATA_DIR}expenses_${userId}.xlsx`;
}

export async function ensureDataDir() {
  const info = await FileSystem.getInfoAsync(DATA_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DATA_DIR, { intermediates: true });
  }
}
