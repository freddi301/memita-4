import { decodeMultiStream, encode } from "@msgpack/msgpack";
import DHT from "hyperdht";
import Hyperswarm, { type Connection } from "hyperswarm";
import type { NetworkFactory } from "../store/store";

export const hyperswarmNetworkFactory: NetworkFactory = ({
  receive,
  connect,
}) => {
  const swarm = new Hyperswarm({
    bootstrap: [
      "127.0.0.1:50000", // ios
      "10.0.2.2:50000", // android
      ...DHT.BOOTSTRAP,
    ],
  });

  const connectionByDeviceId = new Map<string, Connection>();
  const deviceIdToString = (deviceId: Uint8Array) =>
    Buffer.from(deviceId).toString("hex");
  const deviceIdFromString = (deviceId: string) => Buffer.from(deviceId, "hex");

  console.log(`Starting swarm ${deviceIdToString(swarm.keyPair.publicKey)}`);

  swarm.on("connection", async (connection, info) => {
    const deviceIdString = deviceIdToString(info.publicKey);
    connectionByDeviceId.set(deviceIdString, connection);
    console.log(`New connection ${deviceIdString}`);
    connect(info.publicKey);

    connection.on("close", () => {
      connectionByDeviceId.delete(deviceIdString);
      console.log(`Connection closed ${deviceIdString}`);
    });

    connection.on("error", (error) => {
      connectionByDeviceId.delete(deviceIdString);
      console.log(`Connection error ${deviceIdString} ${String(error)}`);
    });

    for await (const message of decodeMultiStream(connection as any)) {
      receive(info.publicKey, message);
    }
  });

  return {
    async getConnectedDevices() {
      return Array.from(connectionByDeviceId.keys(), deviceIdFromString);
    },
    async send(deviceId, data) {
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
    async startJoining() {
      console.log("Joining swarm with topic 'memita'");
      const topic = Buffer.alloc(32).fill("memita");
      const discovery = await swarm.join(topic, { server: true, client: true });
      await discovery.flushed();
    },
  };
};
