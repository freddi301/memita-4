import DHT from "hyperdht";
import Hyperswarm, { type Connection } from "hyperswarm";
import type { NetworkFactory } from "./store.ts";

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
  console.log("Starting swarm " + swarm.keyPair.publicKey.toString("hex"));

  const connectionByDeviceId = new Map<string, Connection>();

  //   swarm.on("update", () => {
  //     emit("myPublicKey", swarm.keyPair.publicKey.toString("hex"));
  //     emit(
  //       "connections",
  //       JSON.stringify(
  //         Array.from(swarm.peers).map(([, peerInfo]) => {
  //           return {
  //             publicKey: peerInfo.publicKey.toString("hex"),
  //           };
  //         })
  //       )
  //     );
  //   });

  swarm.on("connection", (connection, info) => {
    console.log("New connection " + info.publicKey.toString("hex"));

    connect(info.publicKey);

    connectionByDeviceId.set(info.publicKey.toString("hex"), connection);

    connection.on("data", (data) => {
      // console.log("Received: " + data.toString());
      receive(info.publicKey, data);
    });

    connection.on("close", () => {
      console.log("Connection closed " + info.publicKey.toString("hex"));
      connectionByDeviceId.delete(info.publicKey.toString("hex"));
    });

    connection.on("error", (error) => {
      console.log(
        `Connection error ${info.publicKey.toString("hex")} ${String(error)}`,
      );
      connectionByDeviceId.delete(info.publicKey.toString("hex"));
    });
  });

  return {
    async getConnectedDevices() {
      return Array.from(connectionByDeviceId.keys()).map((key) =>
        Buffer.from(key, "hex"),
      );
    },
    async send(deviceId, data) {
      connectionByDeviceId
        .get(Buffer.from(deviceId).toString("hex"))
        ?.write(data as Buffer);
    },
    async startJoining() {
      console.log("Joining swarm with topic 'memita'");
      const topic = Buffer.alloc(32).fill("memita");
      const discovery = await swarm.join(topic, { server: true, client: true });
      await discovery.flushed();
    },
  };
};
