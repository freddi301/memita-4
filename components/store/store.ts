import * as z from "zod";
import {
  AccountId,
  AccountIdSchema,
  DeviceId,
  deviceIdFromDeviceSecret,
  DeviceSecret,
} from "../cryptography/cryptography";
import { ShouldSendProps } from "../queries/shouldSend";

type StoreInInterface<StoreItem> = {
  parse(item: unknown): StoreItem;
  onAdd(item: StoreItem): Promise<void>;
  storage: StorageInterface<StoreItem>;
  networkFactory: NetworkFactory;
  shouldSend(props: ShouldSendProps<StoreItem>): boolean;
  getDeviceByAccounts(): Promise<Map<AccountId, DeviceSecret>>;
  getContacts(accountId: AccountId): Promise<Array<AccountId>>;
};

export type StoreOutInterface<StoreItem> = {
  add(item: StoreItem): Promise<void>;
  all(): Promise<Array<StoreItem>>;
  getContactConnectedDevices(contactId: AccountId): Promise<Array<DeviceId>>;
  stop(): Promise<void>;
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
  join(deviceId: DeviceId, topic: AccountId): Promise<void>;
  leave(deviceId: DeviceId, topic: AccountId): Promise<void>;
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
  getContacts,
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

  const heartbeats = makeHeartbeatRepository();

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
          heartbeats.add(parsed.accountId, deviceId);
          break;
        }
      }
    },
    async connected(deviceId, otherDeviceId) {
      const all = await storage.all();
      // TODO discriminate to which devices to send
      await Promise.all(
        all
          .filter((item) =>
            shouldSend({
              thisAccountId: null as any, // TODO
              otherAccountId: null as any, // TODO
              storeItem: item,
            }),
          )
          .map(async (item) =>
            network.send(deviceId, otherDeviceId, {
              type: "data",
              data: await item,
            }),
          ),
      );
    },
  });

  let isStopped = false;
  const timeoutIds = new Set<ReturnType<typeof setTimeout>>();

  async function sleep(ms: number) {
    if (isStopped) return;
    await new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        timeoutIds.delete(timeoutId);
        resolve();
      }, ms);
      timeoutIds.add(timeoutId);
    });
  }

  async function startStopDevices() {
    if (isStopped) return;
    const deviceByAccounts = await getDeviceByAccounts();
    const devicesToActivateSecrets = new Set(deviceByAccounts.values());
    const devicesToActivatateIds = new Set(
      Array.from(devicesToActivateSecrets).map((deviceSecret) =>
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
    await sleep(1000);
    await startStopDevices();
  }
  void startStopDevices();

  async function heartbeat() {
    if (isStopped) return;
    const deviceByAccounts = await getDeviceByAccounts();
    for (const [accountId, deviceSecret] of deviceByAccounts) {
      const deviceId = deviceIdFromDeviceSecret(deviceSecret);
      for (const toDeviceId of await network.getConnectedDevices(deviceId)) {
        await network.send(deviceId, toDeviceId, {
          type: "accountHeartbeat",
          accountId,
        });
      }
    }
    await sleep(1000);
    await heartbeat();
  }
  void heartbeat();

  // TODO leave topics
  async function joinLeaveTopics() {
    if (isStopped) return;
    const deviceByAccounts = await getDeviceByAccounts();
    for (const [accountId, deviceSecret] of deviceByAccounts) {
      const deviceId = deviceIdFromDeviceSecret(deviceSecret);
      await network.join(deviceId, accountId);
      const contacts = await getContacts(accountId);
      for (const contactId of contacts) {
        await network.join(deviceId, contactId);
      }
    }
    await sleep(1000);
    await joinLeaveTopics();
  }
  void joinLeaveTopics();

  return {
    async add(item) {
      const didAdd = await storage.add(item);
      if (
        didAdd &&
        shouldSend({
          thisAccountId: null as any, // TODO
          otherAccountId: null as any, // TODO
          storeItem: item,
        })
      ) {
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
    async getContactConnectedDevices(contactId: AccountId) {
      return heartbeats.getAccountConnectedDevices(contactId);
    },
    async stop() {
      isStopped = true;
      for (const timeoutId of timeoutIds) {
        clearTimeout(timeoutId);
      }
      timeoutIds.clear();
      for (const deviceId of await network.getStartedDevices()) {
        await network.stop(deviceId);
      }
    },
  };
}

function makeHeartbeatRepository() {
  const byAccountId = new Map<AccountId, Map<DeviceId, number>>();
  const byDeviceId = new Map<DeviceId, Map<AccountId, number>>();
  const add = (accountId: AccountId, deviceId: DeviceId) => {
    const now = Date.now();
    if (!byAccountId.has(accountId)) {
      byAccountId.set(accountId, new Map());
    }
    if (!byDeviceId.has(deviceId)) {
      byDeviceId.set(deviceId, new Map());
    }
    byAccountId.get(accountId)!.set(deviceId, now);
    byDeviceId.get(deviceId)!.set(accountId, now);
  };
  const getAccountConnectedDevices = (accountId: AccountId) => {
    const now = Date.now();
    return Array.from(
      Array.from(
        (byAccountId.get(accountId) ?? new Map<DeviceId, number>()).entries(),
      )
        .filter(([_, timestamp]) => now - timestamp < 4000)
        .map(([deviceId, _]) => deviceId),
    );
  };
  return { add, getAccountConnectedDevices };
}
