import { DeviceId, DeviceSecret } from "../cryptography/cryptography";

type StoreInInterface<StoreItem> = {
  parse(item: unknown): StoreItem;
  onAdd(item: StoreItem): Promise<void>;
  storage: StorageInterface<StoreItem>;
  networkFactory: NetworkFactory;
};

type StoreOutInterface<StoreItem> = {
  add(item: StoreItem): Promise<void>;
  all(): Promise<Array<StoreItem>>;
  start(deviceId: DeviceId, deviceSecret: DeviceSecret): Promise<void>;
  stop(deviceId: DeviceId): Promise<void>;
};

export type StorageInterface<StoreItem> = {
  add(item: StoreItem): Promise<boolean>;
  all(): Promise<Array<StoreItem>>;
  wipe(): Promise<void>;
};

export type NetworkInInterface = {
  received(deviceId: DeviceId, fromDeviceId: DeviceId, data: unknown): Promise<void>;
  connected(deviceId: DeviceId, otherDeviceId: DeviceId): Promise<void>;
};

export type NetworkOutInterface = {
  start(deviceId: DeviceId, deviceSecret: DeviceSecret): Promise<void>;
  stop(deviceId: DeviceId): Promise<void>;
  send(deviceId: DeviceId, toDeviceId: DeviceId, data: unknown): Promise<void>;
  getStartedDevices(): Promise<Array<DeviceId>>;
  getConnectedDevices(deviceId: DeviceId): Promise<Array<DeviceId>>;
};

export type NetworkFactory = (out: NetworkInInterface) => NetworkOutInterface;

export function makeStore<StoreItem>({
  parse,
  onAdd,
  storage,
  networkFactory,
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
      await Promise.all(all.map((item) => network.send(deviceId, otherDeviceId, item)));
    },
  });
  return {
    async add(item) {
      const didAdd = await storage.add(item);
      if (didAdd) {
        await onAdd(item);
        for (const deviceId of await network.getStartedDevices()) {
          for (const toDeviceId of await network.getConnectedDevices(deviceId)) {
            // TODO discriminate to which devices to send
            await network.send(deviceId, toDeviceId, item);
          }
        }
      }
    },
    async all() {
      return await storage.all();
    },
    async start(deviceId, deviceSecret) {
      await network.start(deviceId, deviceSecret);
    },
    async stop(deviceId) {
      await network.stop(deviceId);
    },
  };
}
