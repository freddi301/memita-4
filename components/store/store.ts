import { createContext } from "react";
import {
  AccountSecret,
  DeviceId,
  deviceIdFromDeviceSecret,
  DeviceSecret,
} from "../cryptography/cryptography";
import { DataItem } from "../queries/Queries";

type StoreInInterface<StoreItem> = {
  parse(item: unknown): StoreItem;
  onAdd(item: StoreItem): Promise<void>;
  storage: StorageInterface<StoreItem>;
  networkFactory: NetworkFactory;
  shouldSend(item: StoreItem): boolean;
};

type StoreOutInterface<StoreItem> = {
  add(item: StoreItem): Promise<void>;
  all(): Promise<Array<StoreItem>>;
  updateConnections(
    cryptoPrivateKeys: Record<AccountSecret, DeviceSecret>,
  ): Promise<void>;
};

type StorageInterface<StoreItem> = {
  add(item: StoreItem): Promise<boolean>;
  all(): Promise<Array<StoreItem>>;
};

export type NetworkInInterface = {
  received(
    deviceId: DeviceId,
    fromDeviceId: DeviceId,
    data: unknown,
  ): Promise<void>;
  connected(deviceId: DeviceId, otherDeviceId: DeviceId): Promise<void>;
};

export type NetworkOutInterface = {
  start(deviceSecret: DeviceSecret): Promise<void>;
  stop(deviceId: DeviceId): Promise<void>;
  send(deviceId: DeviceId, toDeviceId: DeviceId, data: unknown): Promise<void>;
  getStartedDevices(): Promise<Array<DeviceId>>;
  getConnectedDevices(deviceId: DeviceId): Promise<Array<DeviceId>>;
};

export type NetworkFactory = (out: NetworkInInterface) => NetworkOutInterface;

// TODO implement close method for network

export function createStore<StoreItem>({
  parse,
  onAdd,
  storage,
  networkFactory,
  shouldSend,
}: StoreInInterface<StoreItem>): StoreOutInterface<StoreItem> {
  const network = networkFactory({
    async received(deviceId, fromDeviceId, data) {
      const item = parse(data);
      const didAdd = await storage.add(item);
      if (didAdd) {
        await onAdd(item);
      }
    },
    async connected(deviceId, otherDeviceId) {
      const all = await storage.all();
      // TODO discriminate to which devices to send
      await Promise.all(
        all
          .filter((item) => shouldSend(item))
          .map((item) => network.send(deviceId, otherDeviceId, item)),
      );
    },
  });
  return {
    async add(item) {
      const didAdd = await storage.add(item);
      if (didAdd && shouldSend(item)) {
        await onAdd(item);
        // TODO do not block ui while sending
        void (async () => {
          for (const deviceId of await network.getStartedDevices()) {
            for (const toDeviceId of await network.getConnectedDevices(
              deviceId,
            )) {
              // TODO discriminate to which devices to send
              await network.send(deviceId, toDeviceId, item);
              // TODO send over files too (might need rework of network typings)
            }
          }
        })();
      }
    },
    async all() {
      return await storage.all();
    },
    async updateConnections(
      cryptoPrivateKeys: Record<AccountSecret, DeviceSecret>,
    ) {
      const deviceIds = Object.values(cryptoPrivateKeys).map((deviceSecret) =>
        deviceIdFromDeviceSecret(deviceSecret),
      );
      for (const deviceId of await network.getStartedDevices()) {
        if (!deviceIds.includes(deviceId)) {
          await network.stop(deviceId);
        }
      }
      const deviceSecrets = Object.values(cryptoPrivateKeys);
      for (const deviceSecret of deviceSecrets) {
        await network.start(deviceSecret);
      }
    },
  };
}

export const AppStoreContext = createContext<StoreOutInterface<DataItem>>(
  null as any,
);
