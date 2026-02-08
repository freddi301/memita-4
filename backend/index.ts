import Hyperswarm from "hyperswarm";

const swarm = new Hyperswarm();

console.log("Starting swarm " + swarm.keyPair.publicKey.toString("hex"));

swarm.on("connection", (connection, info) => {
  console.log("New connection " + info.publicKey.toString("hex"));
  connection.on("data", (data) => console.log("Received: " + data.toString()));
});
const topic = Buffer.alloc(32).fill("memita");
const discovery = swarm.join(topic, { server: true, client: true });
