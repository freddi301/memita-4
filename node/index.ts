import { decode, encode } from "@msgpack/msgpack";
import getPort from "get-port";
import { WebSocket, WebSocketServer } from "ws";
import {
  clientFactory,
  type RemoteRequest,
  type RemoteResponse,
  serverReceive,
} from "../components/remoteApi.ts";
import { hyperswarmNetworkFactory } from "../components/store/hyperswarmNetwork.ts";
import type {
  NetworkInInterface,
  NetworkOutInterface,
} from "../components/store/store.ts";

const hyperswarmNetwork = hyperswarmNetworkFactory(
  new Proxy(
    {},
    {
      get(_, method: string) {
        return (...args: Array<any>) => {
          return Promise.all(
            Array.from(sockets.values()).map((client) =>
              client[method as keyof NetworkInInterface](
                ...(args as Parameters<
                  NetworkInInterface[keyof NetworkInInterface]
                >),
              ),
            ),
          );
        };
      },
    },
  ) as NetworkInInterface,
);

const sockets = new Map<WebSocket, NetworkInInterface>();

getPort({ port: [8090, 8091] }).then((port) => {
  console.log(`WebSocket server listening on port ${port}`);
  const wss = new WebSocketServer({ port });
  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    const [clientReply, client] = clientFactory<NetworkInInterface>(
      (request) =>
        new Promise((resolve, reject) => {
          ws.send(encode(request), (err) => (err ? reject(err) : resolve()));
        }),
    );
    sockets.set(ws, client);
    ws.on("message", function message(data) {
      // console.log("Received WebSocket message: " + data.toString());
      const decoded = decode(data as Buffer);
      if ("method" in (decoded as any)) {
        serverReceive(
          hyperswarmNetwork,
          (message) =>
            new Promise((resolve, reject) =>
              ws.send(encode(message), (err) =>
                err ? reject(err) : resolve(),
              ),
            ),
          decoded as RemoteRequest<
            NetworkOutInterface,
            keyof NetworkOutInterface
          >,
        );
      } else {
        clientReply(
          decoded as RemoteResponse<
            NetworkInInterface,
            keyof NetworkInInterface
          >,
        );
      }
    });
    ws.on("error", (error) => {
      console.error(error);
    });
    ws.on("close", () => {
      console.log("WebSocket connection closed");
      sockets.delete(ws);
    });
  });
});
