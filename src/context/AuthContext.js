import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { listUsers, createUser, findById, updateUser } from '../db/userDb';

const AuthContext = createContext(null);
const LAST_USER_KEY = '@ec:lastUserId';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [bootstrapping, setBootstrapping] = useState(true);

  const refreshUsers = useCallback(async () => {
    const list = await listUsers();
    setUsers(list);
    return list;
  }, []);

  useEffect(() => {
    (async () => {
      try { await refreshUsers(); }
      finally { setBootstrapping(false); }
    })();
  }, [refreshUsers]);

  async function getBiometricCapability() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled   = await LocalAuthentication.isEnrolledAsync();
    const types      = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return { hasHardware, enrolled, types };
  }

  async function promptBiometric(reason = 'Authenticate to continue') {
    const cap = await getBiometricCapability();
    if (!cap.hasHardware) {
      // No biometric hardware — allow access (best-effort on simulator / older devices).
      return { success: true, fallback: 'no-hardware' };
    }
    if (!cap.enrolled) {
      return { success: false, error: 'No biometrics enrolled on this device. Please set up Face ID / fingerprint in system settings.' };
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use device passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    return result;
  }

  async function registerUser(payload) {
    const created = await createUser(payload);
    const list = await refreshUsers();
    return { created, list };
  }

  async function loginWithBiometric(userId) {
    const result = await promptBiometric('Unlock your Kaatha Lo Raasko');
    if (!result.success) {
      const reason = result.error || (result.warning ?? 'Authentication failed');
      throw new Error(reason);
    }
    const found = await findById(userId);
    if (!found) throw new Error('User not found');
    setUser(found);
    await AsyncStorage.setItem(LAST_USER_KEY, userId);
    return found;
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem(LAST_USER_KEY);
  }

  async function updateProfile(patch) {
    if (!user) throw new Error('Not signed in');
    const updated = await updateUser(user.id, patch);
    setUser(updated);
    await refreshUsers();
    return updated;
  }

  return (
    <AuthContext.Provider
      value={{
        user, users, bootstrapping,
        refreshUsers,
        registerUser,
        loginWithBiometric,
        getBiometricCapability,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
