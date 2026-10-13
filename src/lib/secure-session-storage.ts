import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage adapter for the Supabase session on iOS/Android.
 *
 * SecureStore (Keychain / Android Keystore) is limited to ~2 KB per value and sessions are
 * larger, so we follow the pattern recommended by Supabase: a random 256-bit AES key lives in
 * SecureStore and the session JSON is stored AES-CTR-encrypted in AsyncStorage.
 * If the key is lost (e.g. app reinstall on iOS), the encrypted blob is unreadable and the user
 * simply signs in again.
 */
const KEY_PREFIX = 'caloria-session-key.';

function keyName(key: string): string {
  // SecureStore keys only allow alphanumerics, ".", "-" and "_".
  return KEY_PREFIX + key.replace(/[^A-Za-z0-9._-]/g, '_');
}

async function encrypt(key: string, value: string): Promise<string> {
  const encryptionKey = getRandomBytes(32);
  const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
  const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  await SecureStore.setItemAsync(keyName(key), aesjs.utils.hex.fromBytes(encryptionKey), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return aesjs.utils.hex.fromBytes(encrypted);
}

async function decrypt(key: string, value: string): Promise<string | null> {
  const encryptionKeyHex = await SecureStore.getItemAsync(keyName(key));
  if (!encryptionKeyHex) return null;
  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(encryptionKeyHex),
    new aesjs.Counter(1),
  );
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return await decrypt(key, encrypted);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(keyName(key));
  },
};
