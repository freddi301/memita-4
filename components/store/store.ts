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

type NetworkInInterface = {
  receive(data: Uint8Array): Promise<void>;
};

type NetworkOutInterface = {
  send(data: Uint8Array): Promise<void>;
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
    async receive(data) {
      const decoded = networkCodec.decode(data);
      await storage.add(decoded);
      await onAdd(decoded);
    },
  });
  return {
    async add(item) {
      await storage.add(item);
      await onAdd(item);
      const encoded = networkCodec.encode(item);
      await network.send(encoded);
    },
    async all() {
      return await storage.all();
    },
  };
}
