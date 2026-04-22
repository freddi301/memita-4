import { decodeMultiStream, encode } from "@msgpack/msgpack";
import DHT from "hyperdht";
import Hyperswarm, { type Connection } from "hyperswarm";
import {
  type DeviceId,
  deviceIdFromUint8Array,
  deviceIdToUint8Array,
  type DeviceSecret,
  deviceSecretToUint8Array,
} from "../cryptography/cryptography";
import { type NetworkFactory } from "../store/store";

export const hyperswarmNetworkFactory: NetworkFactory = ({
  connected,
  received,
}) => {
  const hyperswarmNodes = new Map<
    DeviceId,
    ReturnType<typeof hyperswarmNodeFactory>
  >();
  return {
    async start(deviceId, deviceSecret) {
      if (hyperswarmNodes.has(deviceId)) {
        return;
      }
      const hyperswarmNodePromise = hyperswarmNodeFactory({
        deviceId,
        deviceSecret,
        received(fromDeviceId, data) {
          return received(deviceId, fromDeviceId, data);
        },
        connected(otherDeviceId) {
          return connected(deviceId, otherDeviceId);
        },
      });
      hyperswarmNodes.set(deviceId, hyperswarmNodePromise);
      await hyperswarmNodePromise;
    },
    async stop(deviceId) {
      const hyperswarmNode = await hyperswarmNodes.get(deviceId);
      if (hyperswarmNode) {
        await hyperswarmNode.stop();
        hyperswarmNodes.delete(deviceId);
      }
    },
    async send(deviceId, toDeviceId, data) {
      const hyperswarmNode = await hyperswarmNodes.get(deviceId);
      if (!hyperswarmNode) {
        throw new Error(`Device ${deviceId} not started`);
      }
      await hyperswarmNode?.send(toDeviceId, data);
    },
    async getConnectedDevices(deviceId) {
      const hyperswarmNode = await hyperswarmNodes.get(deviceId);
      if (!hyperswarmNode) {
        throw new Error(`Device ${deviceId} not started`);
      }
      return await hyperswarmNode.getConnectedDevices();
    },
    async getStartedDevices() {
      return Array.from(hyperswarmNodes.keys());
    },
  };
};

async function hyperswarmNodeFactory({
  deviceId,
  deviceSecret,
  received,
  connected,
}: {
  deviceId: DeviceId;
  deviceSecret: DeviceSecret;
  received(fromDeviceId: DeviceId, data: unknown): Promise<void>;
  connected(otherDeviceId: DeviceId): Promise<void>;
}) {
  console.log(`Starting swarm ${deviceId}`);
  const swarm = new Hyperswarm({
    keyPair: {
      publicKey: Buffer.from(deviceIdToUint8Array(deviceId)),
      secretKey: Buffer.concat([
        Buffer.from(deviceSecretToUint8Array(deviceSecret)),
        Buffer.from(deviceIdToUint8Array(deviceId)),
      ]),
    },
    bootstrap: [
      // local bootstrap nodes for development
      "127.0.0.1:50000", // ios
      "10.0.2.2:50000", // android
      // internet bootstrap nodes
      ...DHT.BOOTSTRAP,
    ],
  });
  await swarm.listen();
  console.log(`Swarm started ${deviceId}`);

  const connectionByDeviceId = new Map<DeviceId, Connection>();

  swarm.on("connection", async (connection, info) => {
    const deviceIdString = deviceIdFromUint8Array(info.publicKey);
    connectionByDeviceId.set(deviceIdString, connection);
    console.log(`New swarm connection ${deviceIdString}`);
    await connected(deviceIdString);
    try {
      for await (const message of decodeMultiStream(connection)) {
        await received(deviceIdString, message);
      }
    } catch (error) {
      // should behave as connection.on("error", (error) => {});
      console.log(`Connection error ${deviceIdString}`, error);
    } finally {
      // should behave as connection.on("close", () => {});
      connectionByDeviceId.delete(deviceIdString);
      console.log(`Connection closed ${deviceIdString}`);
    }
  });

  console.log("Joining swarm with topic 'memita'");
  const topic = Buffer.alloc(32).fill("memita");
  const discovery = await swarm.join(topic, { server: true, client: true });
  await discovery.flushed();

  return {
    async getConnectedDevices() {
      return Array.from(connectionByDeviceId.keys());
    },
    async send(deviceId: DeviceId, data: unknown) {
      const connection = connectionByDeviceId.get(deviceId);
      if (!connection) {
        throw new Error(`No connection to device ${deviceId}`);
      }
      const encoded = encode(data);
      connection.write(
        Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength),
      );
    },
    async stop() {
      await swarm.destroy();
    },
  };
}
