type StoreInInterface<StoreItem> = {
  onAdd(item: StoreItem): Promise<void>;
  storage: StorageInterface<StoreItem>;
  networkFactory: NetworkFactory;
  networkCodec: Codec<StoreItem, Uint8Array>;
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
  receive(deviceId: Uint8Array, data: Uint8Array): Promise<void>;
  connect(deviceId: Uint8Array): Promise<void>;
};

export type NetworkOutInterface = {
  startJoining(): Promise<void>;
  send(deviceId: Uint8Array, data: Uint8Array): Promise<void>;
  getConnectedDevices(): Promise<Array<Uint8Array>>;
};

export type NetworkFactory = (out: NetworkInInterface) => NetworkOutInterface;

export type Codec<X, Y> = {
  encode(data: X): Y;
  decode(data: Y): X;
};

export function makeStore<StoreItem>({
  onAdd,
  storage,
  networkFactory,
  networkCodec,
}: StoreInInterface<StoreItem>): StoreOutInterface<StoreItem> {
  const network = networkFactory({
    async receive(deviceId, data) {
      const decoded = networkCodec.decode(data);
      await storage.add(decoded);
      await onAdd(decoded);
    },
    async connect(deviceId) {
      const all = await storage.all();
      await Promise.all(
        all.map((item) => network.send(deviceId, networkCodec.encode(item))),
      );
    },
  });
  network.startJoining();
  return {
    async add(item) {
      await storage.add(item);
      await onAdd(item);
      const encoded = networkCodec.encode(item);
      for (const deviceId of await network.getConnectedDevices()) {
        await network.send(deviceId, encoded);
      }
    },
    async all() {
      return await storage.all();
    },
  };
}
