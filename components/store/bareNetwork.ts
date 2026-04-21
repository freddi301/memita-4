import { Worklet } from "react-native-bare-kit";
import bundle from "../../components/bundle.js";
import { networkRemoteClientFactory } from "./networkRemoteClient";
import { type NetworkFactory } from "./store";

export const bareNetworkFactory: NetworkFactory = (networkInImplementation) => {
  const worklet = new Worklet();
  worklet.start("/app.bundle", bundle);

  const [receive, client] = networkRemoteClientFactory(async (message) => {
    worklet.IPC.write(message);
  }, networkInImplementation);

  worklet.IPC.on("data", receive);

  return client;
};
