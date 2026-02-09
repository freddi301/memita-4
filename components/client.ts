import b4a from "b4a";
import { useEffect, useState } from "react";
import { Worklet } from "react-native-bare-kit";
import bundle from "../components/bundle.js";

let BACKEND = "node" as "bare" | "node";

const subscriptions = new Map<
  string,
  { count: number; data: any; listeners: Set<(data: any) => void> }
>();

let sendSubscribeToggle = (key: string) => {};

function onReceive(json: any) {
  switch (json.type) {
    case "log": {
      console.log(json.data);
      break;
    }
    case "emit": {
      const subscription = subscriptions.get(json.key);
      if (subscription) {
        subscription.data = json.value;
        subscription.listeners.forEach((listener) => listener(json.value));
      }
      break;
    }
  }
}

switch (BACKEND) {
  case "bare": {
    const worklet = new Worklet();
    worklet.start("/app.bundle", bundle);
    worklet.IPC.on("data", (data: Uint8Array) => {
      const text = b4a.toString(data);
      const json = JSON.parse(text);
      onReceive(json);
    });
    sendSubscribeToggle = (key: string) => {
      worklet.IPC.write(b4a.from(key));
    };
    break;
  }
  case "node": {
    const ws = new WebSocket("ws://10.0.2.2:8090");
    ws.onopen = () => {
      console.log("WebSocket connection opened");
    };
    ws.onmessage = (event) => {
      console.log("Received WebSocket message: " + event.data.toString());
      const text = event.data.toString();
      const json = JSON.parse(text);
      onReceive(json);
    };
    ws.onerror = (event) => {
      console.log("WebSocket error");
    };
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
    sendSubscribeToggle = (key: string) => {
      console.log("Sending subscription toggle: " + key);
      ws.send(key);
    };
    break;
  }
}

export function useData(key: string): any {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (subscriptions.has(key)) {
      subscriptions.get(key)!.count++;
    } else {
      subscriptions.set(key, { count: 1, data: null, listeners: new Set() });
      sendSubscribeToggle(key);
    }
    setData(subscriptions.get(key)!.data);
    const listener = (data: any) => {
      setData(data);
    };
    subscriptions.get(key)!.listeners.add(listener);
    return () => {
      const subscription = subscriptions.get(key)!;
      subscription.count--;
      subscription.listeners.delete(listener);
      if (subscription.count === 0) {
        subscriptions.delete(key);
        sendSubscribeToggle(key);
      }
    };
  }, [key]);
  return data;
}
