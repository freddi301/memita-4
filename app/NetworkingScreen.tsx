import { Text, View } from "react-native";
import { useData } from "./client";

export function NetworkingScreen() {
  const myPublicKey = useData("myPublicKey") as string | undefined;
  const connections = useData("connections") as
    | Array<{ publicKey: string }>
    | undefined;
  return (
    <View>
      <Text>Networking</Text>
      <Text>my public key {myPublicKey}</Text>
      <Text>Connections</Text>
      {connections?.map((conn) => (
        <Text key={conn.publicKey}>{conn.publicKey}</Text>
      ))}
    </View>
  );
}
