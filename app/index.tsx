import b4a from "b4a";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { Worklet } from "react-native-bare-kit";
import bundle from "./bundle.js";

export default function Index() {
  const [response, setResponse] = useState<string | null>(null);

  useEffect(() => {
    const worklet = new Worklet();

    worklet.start("/app.bundle", bundle);

    const { IPC } = worklet;

    IPC.on("data", (data: Uint8Array) =>
      setResponse((response) => response + "\n" + b4a.toString(data))
    );
    IPC.write(b4a.from("Hello from React Native!"));
  }, []);

  return <Text>{response}</Text>;
}
