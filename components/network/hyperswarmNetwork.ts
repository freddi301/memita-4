import { decodeMultiStream, encode } from "@msgpack/msgpack";
import DHT from "hyperdht";
import Hyperswarm, { type Connection } from "hyperswarm";
import { type NetworkFactory } from "../store/store";

export const hyperswarmNetworkFactory: NetworkFactory = ({
  connected,
  received,
}) => {
  const hyperswarmNodes = new Map<
    string,
    Awaited<ReturnType<typeof hyperswarmNodeFactory>>
  >();
  return {
    async start(deviceId, deviceSecret) {
      const deviceIdString = Buffer.from(deviceId).toString("hex");
      if (hyperswarmNodes.has(deviceIdString)) {
        return;
      }
      hyperswarmNodes.set(deviceIdString, null as any); // reserve the deviceId to prevent concurrent starts
      const hyperswarmNode = await hyperswarmNodeFactory({
        deviceId,
        deviceSecret,
        received(fromDeviceId, data) {
          return received(deviceId, fromDeviceId, data);
        },
        connected(otherDeviceId) {
          return connected(deviceId, otherDeviceId);
        },
      });
      hyperswarmNodes.set(deviceIdString, hyperswarmNode);
    },
    async stop(deviceId) {
      const deviceIdString = Buffer.from(deviceId).toString("hex");
      const hyperswarmNode = hyperswarmNodes.get(deviceIdString);
      if (hyperswarmNode) {
        await hyperswarmNode.stop();
        hyperswarmNodes.delete(deviceIdString);
      }
    },
    async send(deviceId, toDeviceId, data) {
      const deviceIdString = Buffer.from(deviceId).toString("hex");
      const hyperswarmNode = hyperswarmNodes.get(deviceIdString);
      // if (!hyperswarmNode) {
      //   throw new Error(`Device ${deviceIdString} not started`);
      // }
      await hyperswarmNode?.send(toDeviceId, data);
    },
    async getConnectedDevices(deviceId) {
      const deviceIdString = Buffer.from(deviceId).toString("hex");
      const hyperswarmNode = hyperswarmNodes.get(deviceIdString);
      // if (!hyperswarmNode) {
      //   throw new Error(`Device ${deviceIdString} not started`);
      // }
      return (await hyperswarmNode?.getConnectedDevices()) ?? [];
    },
    async getStartedDevices() {
      return Array.from(hyperswarmNodes.keys(), (deviceIdString) =>
        Buffer.from(deviceIdString, "hex"),
      );
    },
  };
};

async function hyperswarmNodeFactory({
  deviceId,
  deviceSecret,
  received,
  connected,
}: {
  deviceId: Uint8Array;
  deviceSecret: Uint8Array;
  received(fromDeviceId: Uint8Array, data: unknown): Promise<void>;
  connected(otherDeviceId: Uint8Array): Promise<void>;
}) {
  const swarm = new Hyperswarm({
    // TODO reenable, for some reason is not connecting whe we pass these
    // keyPair: {
    //   publicKey: Buffer.from(deviceId),
    //   secretKey: Buffer.from(deviceSecret),
    // },
    bootstrap: [
      "127.0.0.1:50000", // ios
      "10.0.2.2:50000", // android
      ...DHT.BOOTSTRAP,
    ],
  });
  await swarm.listen();

  const connectionByDeviceId = new Map<string, Connection>();
  const deviceIdToString = (deviceId: Uint8Array) =>
    Buffer.from(deviceId).toString("hex");
  const deviceIdFromString = (deviceId: string) => Buffer.from(deviceId, "hex");

  console.log(`Starting swarm ${deviceIdToString(swarm.keyPair.publicKey)}`);

  swarm.on("connection", async (connection, info) => {
    const deviceIdString = deviceIdToString(info.publicKey);
    connectionByDeviceId.set(deviceIdString, connection);
    console.log(`New connection ${deviceIdString}`);
    connected(info.publicKey);

    connection.on("close", () => {
      connectionByDeviceId.delete(deviceIdString);
      console.log(`Connection closed ${deviceIdString}`);
    });

    connection.on("error", (error) => {
      connectionByDeviceId.delete(deviceIdString);
      console.log(`Connection error ${deviceIdString} ${String(error)}`);
    });

    for await (const message of decodeMultiStream(connection as any)) {
      received(info.publicKey, message);
    }
  });

  console.log("Joining swarm with topic 'memita'");
  const topic = Buffer.alloc(32).fill("memita");
  const discovery = await swarm.join(topic, { server: true, client: true });
  await discovery.flushed();

  return {
    async getConnectedDevices() {
      return Array.from(connectionByDeviceId.keys(), deviceIdFromString);
    },
    async send(deviceId: Uint8Array, data: unknown) {
      const connection = connectionByDeviceId.get(deviceIdToString(deviceId));
      if (!connection) {
        throw new Error(
          `No connection to device ${deviceIdToString(deviceId)}`,
        );
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
