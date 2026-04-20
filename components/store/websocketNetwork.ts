import { Platform } from "react-native";
import { NetworkFactory } from "./store";

export const websocketNetworkFactory: NetworkFactory = ({ receive }) => {
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
  ws.onmessage = (event) => {
    // console.log("Received WebSocket message: " + event.data.toString());
    receive(new Uint8Array(event.data));
  };
  ws.onerror = (event) => {
    // console.log("WebSocket error");
  };
  ws.onclose = () => {
    // console.log("WebSocket connection closed");
  };
  return {
    async send(data: Uint8Array) {
      ws.send(data);
    },
  };
};
