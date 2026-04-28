import AsyncStorage from "@react-native-async-storage/async-storage";
import { use, useSyncExternalStore } from "react";
import * as z from "zod";
import {
  AccountId,
  AccountSecret,
  AccountSecretSchema,
  DeviceId,
  deviceIdFromDeviceSecret,
  DeviceSecret,
  DeviceSecretSchema,
  generateDeviceSecret,
} from "../cryptography/cryptography";
import { languages } from "./languages";

// TODO migration scripts when app updates
// TODO protect data with password or biometric auth
// TODO what to do when data is corrupted?

export const LanguageSchema = z.enum(languages);
export type Language = z.infer<typeof LanguageSchema>;

const StoredDeviceSettingsDataSchema = z.object({
  cryptoPrivateKeys: z.record(AccountSecretSchema, DeviceSecretSchema),
  language: LanguageSchema.optional(),
});

type StoredDeviceSettingsData = z.infer<typeof StoredDeviceSettingsDataSchema>;

type CachedDeviceSettingsData = {
  cryptoPrivateKeys: Record<AccountSecret, DeviceSecret>;
  cryptoPublicKeys: Record<AccountId, DeviceId>;
  language: Language | undefined;
};

function storedToCached(
  stored: StoredDeviceSettingsData,
): CachedDeviceSettingsData {
  return {
    cryptoPrivateKeys: stored.cryptoPrivateKeys,
    cryptoPublicKeys: Object.fromEntries(
      Object.entries(stored.cryptoPrivateKeys).map(
        ([accountSecret, deviceSecret]) => [
          accountSecret,
          deviceIdFromDeviceSecret(deviceSecret),
        ],
      ),
    ),
    language: stored.language,
  };
}

function cachedToStored(
  cached: CachedDeviceSettingsData,
): StoredDeviceSettingsData {
  return {
    cryptoPrivateKeys: cached.cryptoPrivateKeys,
    language: cached.language,
  };
}

const initialStoredData: StoredDeviceSettingsData = { cryptoPrivateKeys: {} };

let cachedData = storedToCached(initialStoredData);

function getSnapshot() {
  return cachedData;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const asyncStorageKey = "deviceSettings";

async function update(data: StoredDeviceSettingsData) {
  cachedData = storedToCached(data);
  listeners.forEach((listener) => listener());
  await AsyncStorage.setItem(
    asyncStorageKey,
    JSON.stringify(
      StoredDeviceSettingsDataSchema.parse(cachedToStored(cachedData)),
    ),
  );
}

async function load() {
  const storedDataString = await AsyncStorage.getItem(asyncStorageKey);
  if (storedDataString) {
    const storedData = StoredDeviceSettingsDataSchema.parse(
      JSON.parse(storedDataString),
    );
    await update(storedData);
  } else {
    await update(initialStoredData);
  }
}

async function wipe() {
  await AsyncStorage.removeItem(asyncStorageKey);
  await update(initialStoredData);
}

const loadPromise = load();

async function addAccount(accountSecret: AccountSecret) {
  const deviceSecret = generateDeviceSecret();
  await update({
    cryptoPrivateKeys: {
      ...cachedData.cryptoPrivateKeys,
      [accountSecret]: deviceSecret,
    },
  });
}
async function removeAccount(accountId: AccountId) {
  const { [accountId as any]: _, ...cryptoPrivateKeys } =
    cachedData.cryptoPrivateKeys;
  await update({ cryptoPrivateKeys });
}

async function setLanguage(language: Language | undefined) {
  await update({ ...cachedData, language });
}

export function useDeviceSettings() {
  use(loadPromise);
  return {
    ...useSyncExternalStore(subscribe, getSnapshot),
    addAccount,
    removeAccount,
    setLanguage,
  };
}

export const deviceSettingsStore = {
  getSnapshot,
  subscribe,
  addAccount,
  removeAccount,
  wipe,
};
