import AsyncStorage from "@react-native-async-storage/async-storage";
import { isEqual } from "lodash";
import { StorageInterface } from "./store";

export function makeLocalStorage<StoreItem>(
  key: string,
): StorageInterface<StoreItem> {
  return {
    async all() {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    },
    async add(item: StoreItem): Promise<void> {
      const current = await AsyncStorage.getItem(key);
      const currentParsed: Array<StoreItem> = current
        ? JSON.parse(current)
        : [];
      if (!currentParsed.some((i) => isEqual(i, item))) {
        currentParsed.push(item);
        await AsyncStorage.setItem(key, JSON.stringify(currentParsed));
      }
    },
    async wipe(): Promise<void> {
      await AsyncStorage.removeItem(key);
    },
  };
}
