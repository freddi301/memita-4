import { startSwarm } from "../backend/swarm";
const { IPC } = BareKit;

startSwarm({
  log(data) {
    IPC.write(Buffer.from(data));
  },
});
