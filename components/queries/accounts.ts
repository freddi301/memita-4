import {
  AccountId,
  accountIdFromAccountSecret,
  AccountSecret,
  DeviceId,
  deviceIdFromDeviceSecret,
  generateDeviceSecret,
} from "../cryptography/cryptography";
import { MemitaMutation, MemitaQuery } from "../store/feApi";
import { groupBy, maxBy } from "./helpers";
import { nowTimestamp } from "./Timestamp";

export const addAccount: MemitaMutation<{
  accountSecret: AccountSecret;
  name: string;
}> =
  ({ accountSecret, name }) =>
  async ({ appStorage }) => {
    const accountId = accountIdFromAccountSecret(accountSecret);
    const deviceSecret = generateDeviceSecret();
    await appStorage.write((current) => {
      return {
        ...current,
        deviceSettings: {
          ...current.deviceSettings,
          cryptoPrivateKeys: {
            ...current.deviceSettings.cryptoPrivateKeys,
            [accountSecret]: deviceSecret,
          },
        },
        data: [
          ...current.data,
          {
            type: "ContactUpdate",
            accountId,
            contactId: accountId,
            name,
            deleted: false,
            timestamp: nowTimestamp(),
          },
        ],
      };
    });
  };

export const removeAccount: MemitaMutation<{ accountId: AccountId }> =
  ({ accountId }) =>
  async ({ appStorage }) => {
    await appStorage.write((current) => {
      const newCryptoPrivateKeys = Object.fromEntries(
        Object.entries(current.deviceSettings.cryptoPrivateKeys).filter(
          ([accountSecret, _]) => {
            const currentAccountId = accountIdFromAccountSecret(
              accountSecret as AccountSecret,
            );
            return currentAccountId !== accountId;
          },
        ),
      );
      return {
        ...current,
        deviceSettings: {
          ...current.deviceSettings,
          cryptoPrivateKeys: newCryptoPrivateKeys,
        },
        data: [
          ...current.data,
          {
            type: "ContactUpdate",
            accountId,
            contactId: accountId,
            name: "",
            deleted: true,
            timestamp: nowTimestamp(),
          },
        ],
      };
    });
  };

export const getDeviceId: MemitaQuery<
  { accountId: AccountId | undefined },
  DeviceId | undefined
> =
  ({ accountId }) =>
  async ({ appStorage }) => {
    const current = await appStorage.read();
    const deviceSecret = Object.entries(
      current.deviceSettings.cryptoPrivateKeys,
    ).find(([accountSecret]) => {
      const currentAccountId = accountIdFromAccountSecret(
        accountSecret as AccountSecret,
      );
      return currentAccountId === accountId;
    })?.[1];
    if (deviceSecret) {
      return deviceIdFromDeviceSecret(deviceSecret);
    }
  };

export const accountList: MemitaQuery<
  void,
  Array<{ accountId: AccountId; name: string }>
> =
  () =>
  async ({ appStorage }) => {
    const current = await appStorage.read();
    const all = current.data;
    return groupBy(
      all
        .filter((item) => item.type === "ContactUpdate")
        .filter((update) => update.accountId === update.contactId),
      (update) => [update.accountId],
      (updates) => maxBy(updates, (update) => update.timestamp),
    )
      .filter((update) => !update.deleted)
      .map((update) => ({ accountId: update.accountId, name: update.name }));
  };
