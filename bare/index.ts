import { startSwarm } from "../backend/swarm";
const { IPC } = BareKit;

startSwarm({
  log(data) {
    IPC.write(
      Buffer.from(
        JSON.stringify({
          type: "log",
          data,
        })
      )
    );
  },
  emit(key, value) {
    IPC.write(
      Buffer.from(
        JSON.stringify({
          type: "emit",
          key,
          value,
        })
      )
    );
  },
});
