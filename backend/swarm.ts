import Hyperswarm from "hyperswarm";

export function startSwarm({ log }: { log(data: string): void }) {
  const swarm = new Hyperswarm();

  log("Starting swarm " + swarm.keyPair.publicKey.toString("hex"));

  swarm.on("connection", (connection, info) => {
    log("New connection " + info.publicKey.toString("hex"));
    connection.on("data", (data) => log("Received: " + data.toString()));
    connection.on("error", (error) =>
      log(
        "Connection error " +
          info.publicKey.toString("hex") +
          " " +
          error.toString()
      )
    );
  });
  const topic = Buffer.alloc(32).fill("memita");
  const discovery = swarm.join(topic, { server: true, client: true });
}
