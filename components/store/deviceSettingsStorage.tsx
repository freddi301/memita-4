import { createContext, use, useState } from "react";
import * as z from "zod";
import {
  AccountId,
  accountIdFromAccountSecret,
  AccountSecret,
  DeviceId,
  deviceIdFromDeviceSecret,
  DeviceSecret,
  generateDeviceSecret,
} from "../cryptography/cryptography";
import { AppStorageContext } from "../storage/AppStorage";
import {
  Language,
  StoredDeviceSettingsDataSchema,
  Theme,
} from "../storage/storageSchema";

type StoredDeviceSettingsData = z.infer<typeof StoredDeviceSettingsDataSchema>;

type CachedDeviceSettingsData = {
  cryptoPrivateKeys: Record<AccountSecret, DeviceSecret>;
  cryptoPublicKeys: Record<AccountId, DeviceId>;
  language: Language | undefined;
  theme: Theme | undefined;
};

function storedToCached(
  stored: StoredDeviceSettingsData,
): CachedDeviceSettingsData {
  return {
    cryptoPrivateKeys: stored.cryptoPrivateKeys,
    cryptoPublicKeys: Object.fromEntries(
      Object.entries(stored.cryptoPrivateKeys).map(
        ([accountSecret, deviceSecret]) => [
          accountIdFromAccountSecret(accountSecret as AccountSecret),
          deviceIdFromDeviceSecret(deviceSecret),
        ],
      ),
    ),
    language: stored.language,
    theme: stored.theme,
  };
}

const DeviceSettingsContext = createContext<
  CachedDeviceSettingsData & {
    addAccount(accountSecret: AccountSecret): Promise<void>;
    removeAccount(accountId: AccountId): Promise<void>;
    setLanguage(language: Language | undefined): Promise<void>;
    setTheme(theme: Theme | undefined): Promise<void>;
  }
>(null as any);

export function DeviceSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appStorage = use(AppStorageContext);
  const [reading, setReading] = useState(() => appStorage.read());

  async function update(
    updater: (current: StoredDeviceSettingsData) => StoredDeviceSettingsData,
  ) {
    await appStorage.write((current) => ({
      ...current,
      deviceSettings: updater(current.deviceSettings),
    }));
    setReading(appStorage.read());
  }

  async function addAccount(accountSecret: AccountSecret) {
    const deviceSecret = generateDeviceSecret();
    await update((current) => {
      return {
        ...current,
        cryptoPrivateKeys: {
          ...current.cryptoPrivateKeys,
          [accountSecret]: deviceSecret,
        },
      };
    });
  }
  async function removeAccount(accountId: AccountId) {
    await update((current) => {
      const { [accountId as any]: _, ...cryptoPrivateKeys } =
        current.cryptoPrivateKeys;
      return { ...current, cryptoPrivateKeys };
    });
  }

  async function setLanguage(language: Language | undefined) {
    await update((current) => ({ ...current, language }));
  }

  async function setTheme(theme: Theme | undefined) {
    await update((current) => ({ ...current, theme }));
  }

  const state = storedToCached(use(reading).deviceSettings);

  return (
    <DeviceSettingsContext
      value={{ ...state, addAccount, removeAccount, setLanguage, setTheme }}
    >
      {children}
    </DeviceSettingsContext>
  );
}

export function useDeviceSettings() {
  return use(DeviceSettingsContext);
}
