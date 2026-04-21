import { Platform } from "react-native";
import { networkRemoteClientFactory } from "./networkRemoteClient";
import { NetworkFactory } from "./store";

export const websocketNetworkFactory: NetworkFactory = (
  networkInImplementation,
) => {
  const ws = new WebSocket(
    Platform.select({
      web: "ws://localhost:8091",
      default: "ws://10.0.2.2:8090",
    }),
  );
  ws.binaryType = "arraybuffer";
  ws.onopen = () => {
    // console.log("WebSocket connection opened");
  };
  const [receive, client] = networkRemoteClientFactory(
    (message) => ws.send(message),
    networkInImplementation,
  );
  ws.onmessage = (event) => {
    receive(event.data as ArrayBuffer);
  };
  ws.onerror = (event) => {
    // console.log("WebSocket error");
  };
  ws.onclose = () => {
    // console.log("WebSocket connection closed");
  };
  return client;
};
