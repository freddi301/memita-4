import Hyperswarm from "hyperswarm";
import type { NetworkFactory } from "./store.ts";

export const hyperswarmNetworkFactory: NetworkFactory = ({ receive }) => {
  const swarm = new Hyperswarm();
  console.log("Starting swarm " + swarm.keyPair.publicKey.toString("hex"));

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

    connection.on("data", (data) => {
      // console.log("Received: " + data.toString());
      receive(data);
    });

    connection.on("error", (error) => {
      console.log(
        `Connection error ${info.publicKey.toString("hex")} ${error.toString()}`,
      );
    });
  });

  const topic = Buffer.alloc(32).fill("memita");
  const discovery = swarm.join(topic, { server: true, client: true });

  return {
    async send(data) {
      // console.log("Sending: " + data.toString());
      swarm.connections.forEach((connection) => {
        connection.write(data as Buffer);
      });
    },
  };
};
