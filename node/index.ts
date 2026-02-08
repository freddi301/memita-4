import { startSwarm } from "../backend/swarm.ts";

startSwarm({
  log(data) {
    console.log(data);
  },
});
