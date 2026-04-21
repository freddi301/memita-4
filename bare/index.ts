import "./polyfills";
// leave this blank line here, otherwise vscode will move it lower, we need it to load first
import { decodeMultiStream, encode } from "@msgpack/msgpack";
import { hyperswarmNetworkFactory } from "../components/network/hyperswarmNetwork";
import {
  clientFactory,
  type RemoteRequest,
  type RemoteResponse,
  serverReceive,
} from "../components/remoteApi";
import {
  type NetworkInInterface,
  type NetworkOutInterface,
} from "../components/store/store";

const [clientReply, client] = clientFactory<NetworkInInterface>(
  async (request) => BareKit.IPC.write(encode(request)),
);

const hyperswarmNetwork = hyperswarmNetworkFactory(client);

(async () => {
  for await (const decoded of decodeMultiStream(BareKit.IPC as any)) {
    if ("method" in (decoded as any)) {
      serverReceive(
        hyperswarmNetwork,
        async (message) => BareKit.IPC.write(encode(message)),
        decoded as RemoteRequest<
          NetworkOutInterface,
          keyof NetworkOutInterface
        >,
      );
    } else {
      clientReply(
        decoded as RemoteResponse<NetworkInInterface, keyof NetworkInInterface>,
      );
    }
  }
})();
