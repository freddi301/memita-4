import { decode, encode } from "@msgpack/msgpack";
import {
  clientFactory,
  RemoteRequest,
  RemoteResponse,
  serverReceive,
} from "../remoteApi";
import { NetworkInInterface, NetworkOutInterface } from "./store";

export function networkRemoteClientFactory(
  send: (message: Uint8Array) => Promise<void>,
  networkInImplementation: NetworkInInterface,
): [(message: Uint8Array) => void, NetworkOutInterface] {
  const [clientReply, client] = clientFactory<NetworkOutInterface>(
    async (request) => send(encode(request)),
  );
  return [
    (message) => {
      // console.log("Received WebSocket message: " + event.data.toString());
      const decoded = decode(message);
      if ("method" in (decoded as any)) {
        serverReceive(
          networkInImplementation,
          async (response) => send(encode(response)),
          decoded as RemoteRequest<
            NetworkInInterface,
            keyof NetworkInInterface
          >,
        );
      } else {
        clientReply(
          decoded as RemoteResponse<
            NetworkOutInterface,
            keyof NetworkOutInterface
          >,
        );
      }
    },
    client,
  ];
}
