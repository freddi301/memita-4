type StoreInInterface<StoreItem> = {
  onAdd(item: StoreItem): Promise<void>;
  storage: StorageInterface<StoreItem>;
  networkFactory: NetworkFactory;
};

type StoreOutInterface<StoreItem> = {
  add(item: StoreItem): Promise<void>;
  all(): Promise<Array<StoreItem>>;
  start(deviceId: Uint8Array, deviceSecret: Uint8Array): Promise<void>;
  stop(deviceId: Uint8Array): Promise<void>;
};

export type StorageInterface<StoreItem> = {
  add(item: StoreItem): Promise<void>;
  all(): Promise<Array<StoreItem>>;
  wipe(): Promise<void>;
};

export type NetworkInInterface = {
  received(
    deviceId: Uint8Array,
    fromDeviceId: Uint8Array,
    data: unknown,
  ): Promise<void>;
  connected(deviceId: Uint8Array, otherDeviceId: Uint8Array): Promise<void>;
};

export type NetworkOutInterface = {
  start(deviceId: Uint8Array, deviceSecret: Uint8Array): Promise<void>;
  stop(deviceId: Uint8Array): Promise<void>;
  send(
    deviceId: Uint8Array,
    toDeviceId: Uint8Array,
    data: unknown,
  ): Promise<void>;
  getStartedDevices(): Promise<Array<Uint8Array>>;
  getConnectedDevices(deviceId: Uint8Array): Promise<Array<Uint8Array>>;
};

export type NetworkFactory = (out: NetworkInInterface) => NetworkOutInterface;

export function makeStore<StoreItem>({
  onAdd,
  storage,
  networkFactory,
}: StoreInInterface<StoreItem>): StoreOutInterface<StoreItem> {
  const network = networkFactory({
    async received(deviceId, fromDeviceId, data) {
      await storage.add(data as StoreItem);
      await onAdd(data as StoreItem);
    },
    async connected(deviceId, otherDeviceId) {
      const all = await storage.all();
      await Promise.all(
        all.map((item) => network.send(deviceId, otherDeviceId, item)),
      );
    },
  });
  return {
    async add(item) {
      await storage.add(item);
      await onAdd(item);
      for (const deviceId of await network.getStartedDevices()) {
        for (const toDeviceId of await network.getConnectedDevices(deviceId)) {
          await network.send(deviceId, toDeviceId, item);
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
