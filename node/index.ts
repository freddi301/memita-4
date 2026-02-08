import getPort from "get-port";
import { WebSocket, WebSocketServer } from "ws";
import { startSwarm } from "../backend/swarm.ts";

startSwarm({
  log(data) {
    console.log(data);
  },
  emit(key, value) {
    subscriptionsByConnections.forEach((subscriptions, connection) => {
      if (subscriptions.has(key)) {
        console.log("Emitting " + key + ": " + value);
        connection.send(JSON.stringify({ type: "emit", key, value }));
      }
    });
  },
});

getPort({ port: [8090, 8091] }).then((port) => {
  console.log(`WebSocket server listening on port ${port}`);
  const wss = new WebSocketServer({ port });
  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    subscriptionsByConnections.set(ws, new Set());
    ws.on("message", function message(data) {
      console.log("Received subscription toggle: " + data.toString());
      const key = data.toString();
      if (subscriptionsByConnections.get(ws)!.has(key)) {
        subscriptionsByConnections.get(ws)!.delete(key);
      } else {
        subscriptionsByConnections.get(ws)!.add(key);
      }
    });
    ws.on("error", console.error);
    ws.on("close", () => {
      subscriptionsByConnections.delete(ws);
      console.log("WebSocket connection closed");
    });
  });
});

const subscriptionsByConnections = new Map<WebSocket, Set<string>>();
