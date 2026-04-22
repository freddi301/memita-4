import AsyncStorage from "@react-native-async-storage/async-storage";
import { isEqual } from "lodash";
import { StorageInterface } from "./store";

export function localStorageFactory<StoreItem>(
  key: string,
  parse: (item: unknown) => StoreItem,
): StorageInterface<StoreItem> {
  async function loadSafe(): Promise<Array<StoreItem>> {
    const loaded = await AsyncStorage.getItem(key);
    if (!loaded) return [];
    const parsed = JSON.parse(loaded);
    if (!Array.isArray(parsed)) throw new Error("Invalid data in localStorage");
    return parsed.map(parse);
  }

  return {
    async all() {
      return await loadSafe();
    },
    async add(item) {
      const current = await loadSafe();
      if (!current.some((i) => isEqual(i, item))) {
        current.push(item);
        await AsyncStorage.setItem(key, JSON.stringify(current));
        return true;
      }
      return false;
    },
    async wipe() {
      await AsyncStorage.removeItem(key);
    },
  };
}
