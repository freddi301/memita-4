import getPort from "get-port";
import { WebSocket, WebSocketServer } from "ws";
import { hyperswarmNetworkFactory } from "../components/store/hyperswarmNetwork.ts";

const hyperswarmNetwork = hyperswarmNetworkFactory({
  async receive(data) {
    sockets.forEach((socket) => {
      socket.send(data);
    });
  },
});

const sockets = new Set<WebSocket>();

getPort({ port: [8090, 8091] }).then((port) => {
  console.log(`WebSocket server listening on port ${port}`);
  const wss = new WebSocketServer({ port });
  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    sockets.add(ws);
    ws.on("message", function message(data) {
      // console.log("Received WebSocket message: " + data.toString());
      hyperswarmNetwork.send(data as Buffer);
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
