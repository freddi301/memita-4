import { Platform } from "react-native";
import { networkRemoteClientFactory } from "./networkRemoteClient";
import { NetworkFactory } from "./store";

export const websocketNetworkFactory: NetworkFactory = (
  networkInImplementation,
) => {
  const ws = new WebSocket(
    Platform.select({
      web: "ws://localhost:8091",
      ios: "ws://127.0.0.1:8090",
      android: "ws://10.0.2.2:8090",
      default: "",
    }),
  );
  ws.binaryType = "arraybuffer";

  const websocketReady = new Promise<void>((resolve) => {
    ws.onopen = () => {
      console.log("WebSocket connection opened");
      resolve();
    };
  });

  const [receive, client] = networkRemoteClientFactory(async (message) => {
    await websocketReady;
    ws.send(message);
  }, networkInImplementation);
  ws.onmessage = (event) => {
    receive(new Uint8Array(event.data));
  };
  ws.onerror = (event) => {
    console.log("WebSocket error", event);
  };
  ws.onclose = () => {
    console.log("WebSocket connection closed");
  };
  return client;
};
