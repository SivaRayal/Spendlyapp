import * as FileSystem from 'expo-file-system/legacy';
import { USERS_FILE, ensureDataDir } from './paths';

async function readAll() {
  await ensureDataDir();
  const info = await FileSystem.getInfoAsync(USERS_FILE);
  if (!info.exists) return [];
  const raw = await FileSystem.readAsStringAsync(USERS_FILE);
  if (!raw.trim()) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function writeAll(users) {
  await ensureDataDir();
  await FileSystem.writeAsStringAsync(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function listUsers() {
  return readAll();
}

export async function findByEmail(email) {
  const users = await readAll();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function findById(id) {
  const users = await readAll();
  return users.find(u => u.id === id);
}

export async function createUser({ name, email, phone }) {
  const users = await readAll();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: (phone || '').trim(),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeAll(users);
  return user;
}

export async function updateUser(id, patch) {
  const users = await readAll();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('User not found');
  users[idx] = { ...users[idx], ...patch };
  await writeAll(users);
  return users[idx];
}

export async function deleteUser(id) {
  const users = await readAll();
  await writeAll(users.filter(u => u.id !== id));
}
