const { IPC } = BareKit;
import { hyperswarmNetworkFactory } from "../components/store/hyperswarmNetwork";

const hyperswarmNetwork = hyperswarmNetworkFactory({
  async receive(data) {
    IPC.write(data as any);
  },
});

IPC.on("data", (data) => {
  hyperswarmNetwork.send(data);
});
