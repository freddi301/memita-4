import b4a from "b4a";
import { Codec } from "./store";

export function makeNetworkJsonCodec<StoreItem>(): Codec<StoreItem, Buffer> {
  return {
    encode(data) {
      const jsonString = JSON.stringify(data);
      return b4a.from(jsonString, "utf-8") as Buffer;
    },
    decode(data) {
      const jsonString = b4a.toString(data, "utf-8");
      return JSON.parse(jsonString);
    },
  };
}
