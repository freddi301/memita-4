import { Worklet } from "react-native-bare-kit";
import bundle from "../../components/bundle.js";
import { NetworkFactory } from "./store.js";

export const bareNetworkFactory: NetworkFactory = ({ receive }) => {
  const worklet = new Worklet();
  worklet.start("/app.bundle", bundle);
  worklet.IPC.on("data", (data: Uint8Array) => {
    receive(data);
  });
  return {
    async send(data) {
      worklet.IPC.write(data);
    },
  };
};
