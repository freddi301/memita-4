type StoreInInterface<StoreItem> = {
  onAdd(item: StoreItem): Promise<void>;
  storage: StorageInterface<StoreItem>;
  networkFactory: NetworkFactory;
};

type StoreOutInterface<StoreItem> = {
  add(item: StoreItem): Promise<void>;
  all(): Promise<Array<StoreItem>>;
};

export type StorageInterface<StoreItem> = {
  add(item: StoreItem): Promise<void>;
  all(): Promise<Array<StoreItem>>;
  wipe(): Promise<void>;
};

export type NetworkInInterface = {
  receive(deviceId: Uint8Array, data: unknown): Promise<void>;
  connect(deviceId: Uint8Array): Promise<void>;
};

export type NetworkOutInterface = {
  startJoining(): Promise<void>;
  send(deviceId: Uint8Array, data: unknown): Promise<void>;
  getConnectedDevices(): Promise<Array<Uint8Array>>;
};

export type NetworkFactory = (out: NetworkInInterface) => NetworkOutInterface;

export function makeStore<StoreItem>({
  onAdd,
  storage,
  networkFactory,
}: StoreInInterface<StoreItem>): StoreOutInterface<StoreItem> {
  const network = networkFactory({
    async receive(deviceId, data) {
      await storage.add(data as StoreItem);
      await onAdd(data as StoreItem);
    },
    async connect(deviceId) {
      const all = await storage.all();
      await Promise.all(all.map((item) => network.send(deviceId, item)));
    },
  });
  network.startJoining();
  return {
    async add(item) {
      await storage.add(item);
      await onAdd(item);
      for (const deviceId of await network.getConnectedDevices()) {
        await network.send(deviceId, item);
      }
    },
    async all() {
      return await storage.all();
    },
  };
}
