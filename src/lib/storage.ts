import AsyncStorage from '@react-native-async-storage/async-storage';

/** Namespaced, JSON-safe wrapper around AsyncStorage for non-sensitive local data. */
const PREFIX = '@caloria-facil:';

export const storageKeys = {
  preferences: 'preferences',
} as const;

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.warn(`[storage] failed to read "${key}"`, error);
    return null;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] failed to write "${key}"`, error);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch (error) {
    console.warn(`[storage] failed to remove "${key}"`, error);
  }
}
