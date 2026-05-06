import * as z from "zod";
import {
  AccountId,
  AccountIdSchema,
  DeviceId,
  deviceIdFromDeviceSecret,
  DeviceSecret,
} from "../cryptography/cryptography";

type StoreInInterface<StoreItem> = {
  parse(item: unknown): StoreItem;
  onAdd(item: StoreItem): Promise<void>;
  storage: StorageInterface<StoreItem>;
  networkFactory: NetworkFactory;
  shouldSend(item: StoreItem): boolean;
  getDeviceByAccounts(): Promise<Map<AccountId, DeviceSecret>>;
};

export type StoreOutInterface<StoreItem> = {
  add(item: StoreItem): Promise<void>;
  all(): Promise<Array<StoreItem>>;
  isContactConnected(contactId: AccountId): Promise<boolean>;
};

type StorageInterface<StoreItem> = {
  add(item: StoreItem): Promise<boolean>;
  all(): Promise<Array<StoreItem>>;
};

export type NetworkInInterface = {
  received(
    deviceId: DeviceId,
    fromDeviceId: DeviceId,
    message: unknown,
  ): Promise<void>;
  connected(deviceId: DeviceId, otherDeviceId: DeviceId): Promise<void>;
};

export type NetworkOutInterface = {
  start(deviceSecret: DeviceSecret): Promise<void>;
  stop(deviceId: DeviceId): Promise<void>;
  send(
    deviceId: DeviceId,
    toDeviceId: DeviceId,
    message: unknown,
  ): Promise<void>;
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
  getDeviceByAccounts,
}: StoreInInterface<StoreItem>): StoreOutInterface<StoreItem> {
  const ProtocolMessageSchema = z.discriminatedUnion("type", [
    z.object({
      type: z.literal("data"),
      data: z.unknown().transform((value, ctx) => {
        try {
          return parse(value);
        } catch (err) {
          ctx.addIssue({
            code: "custom",
            message: err instanceof Error ? err.message : "Parsing failed",
          });
          return z.NEVER;
        }
      }),
    }),
    z.object({
      type: z.literal("accountHeartbeat"),
      accountId: AccountIdSchema,
    }),
  ]);
  // type ProtocolMessage = z.infer<typeof ProtocolMessageSchema>;

  const receivedHeartbeats = new Map<AccountId, number>();

  const network = networkFactory({
    async received(deviceId, fromDeviceId, data) {
      const parsed = ProtocolMessageSchema.parse(data);
      switch (parsed.type) {
        case "data": {
          const item = parse(data);
          const didAdd = await storage.add(item);
          if (didAdd) {
            await onAdd(item);
          }
          break;
        }
        case "accountHeartbeat": {
          receivedHeartbeats.set(parsed.accountId, Date.now());
          break;
        }
      }
    },
    async connected(deviceId, otherDeviceId) {
      const all = await storage.all();
      // TODO discriminate to which devices to send
      await Promise.all(
        all
          .filter((item) => shouldSend(item))
          .map(async (item) =>
            network.send(deviceId, otherDeviceId, {
              type: "data",
              data: await item,
            }),
          ),
      );
    },
  });
  async function startStopDevices() {
    const deviceByAccounts = await getDeviceByAccounts();
    const devicesToActivateSecrets = new Set(deviceByAccounts.values());
    const devicesToActivatateIds = new Set(
      Object.values(devicesToActivateSecrets).map((deviceSecret) =>
        deviceIdFromDeviceSecret(deviceSecret),
      ),
    );
    for (const deviceId of await network.getStartedDevices()) {
      if (!devicesToActivatateIds.has(deviceId)) {
        await network.stop(deviceId);
      }
    }
    for (const deviceSecret of devicesToActivateSecrets) {
      await network.start(deviceSecret);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await startStopDevices();
  }
  void startStopDevices();
  async function heartbeat() {
    const deviceByAccounts = await getDeviceByAccounts();
    for (const [accountId, deviceSecret] of deviceByAccounts) {
      const deviceId = deviceIdFromDeviceSecret(deviceSecret);
      await network.send(deviceId, deviceId, {
        type: "accountHeartbeat",
        accountId,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await heartbeat();
  }
  void heartbeat();
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
              await network.send(deviceId, toDeviceId, {
                type: "data",
                data: await item,
              });
              // TODO send over files too
            }
          }
        })();
      }
    },
    async all() {
      return await storage.all();
    },
    async isContactConnected(accountId) {
      const now = Date.now();
      const timestamp = receivedHeartbeats.get(accountId);
      return timestamp !== undefined && now - timestamp < 4000;
    },
  };
}
