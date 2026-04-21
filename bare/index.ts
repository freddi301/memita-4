import "./polyfills";
// leave this blank line here, otherwise vscode will move it lower, we need it to load first
import { decode, encode } from "@msgpack/msgpack";
import {
  clientFactory,
  type RemoteRequest,
  type RemoteResponse,
  serverReceive,
} from "../components/remoteApi";
import { hyperswarmNetworkFactory } from "../components/store/hyperswarmNetwork";
import {
  type NetworkInInterface,
  type NetworkOutInterface,
} from "../components/store/store";

const { IPC } = BareKit;

const [clientReply, client] = clientFactory<NetworkInInterface>(
  async (request) => IPC.write(encode(request) as Buffer),
);

const hyperswarmNetwork = hyperswarmNetworkFactory(client);

IPC.on("data", (data) => {
  const decoded = decode(data);
  if ("method" in (decoded as any)) {
    serverReceive(
      hyperswarmNetwork,
      async (message) => IPC.write(encode(message) as Buffer),
      decoded as RemoteRequest<NetworkOutInterface, keyof NetworkOutInterface>,
    );
  } else {
    clientReply(
      decoded as RemoteResponse<NetworkInInterface, keyof NetworkInInterface>,
    );
  }
});
