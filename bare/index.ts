import Hyperswarm from "hyperswarm";
const { IPC } = BareKit;

const swarm = new Hyperswarm();

IPC.write(
  Buffer.from("Starting swarm " + swarm.keyPair.publicKey.toString("hex"))
);

swarm.on("connection", (conn, info) => {
  IPC.write(Buffer.from("New connection " + info.publicKey.toString("hex")));
  conn.on("data", (data) =>
    IPC.write(Buffer.from("Received: " + data.toString()))
  );
});

const topic = Buffer.alloc(32).fill("memita"); // A topic must be 32 bytes

const discovery = swarm.join(topic, { server: true, client: true });

IPC.on("data", (data) => console.log(data.toString()));
IPC.write(Buffer.from("Hello from Bare!"));
