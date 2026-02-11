import AsyncStorage from "@react-native-async-storage/async-storage";
import { dataToQuery, extract, Plain, Query } from "./QL";
import { Root } from "./Queries";

type DataApi<Data extends Plain> = {
  read<Result extends Plain>(
    query: (root: Query<Data>) => Query<Result>
  ): Promise<Result>;
  write(query: (root: Query<Data>) => Query<Data>): Promise<void>;
};

function inMemoryDataApi<Data extends Plain>(data: Data): DataApi<Data> {
  let last: Promise<any> = Promise.resolve();
  return {
    read(query) {
      const perform = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return query(dataToQuery(data))[extract];
      };
      const performed = perform();
      return performed;
    },
    write(query) {
      const perform = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        data = query(dataToQuery(data))[extract];
      };
      const performed = last.then(perform);
      last = performed;
      return performed;
    },
  };
}

function asyncStorageDataApi<Data extends Plain>(initial: Data): DataApi<Data> {
  let last: Promise<any> = Promise.resolve();
  return {
    async read(query) {
      const perform = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const json = await AsyncStorage.getItem("data");
        const parsed = dataToQuery<Data>(json ? JSON.parse(json) : initial);
        return query(parsed)[extract];
      };
      const performed = perform();
      return performed;
    },
    async write(query) {
      const perform = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const json = await AsyncStorage.getItem("data");
        const parsed = dataToQuery<Data>(json ? JSON.parse(json) : initial);
        const updated = query(parsed);
        await AsyncStorage.setItem("data", JSON.stringify(updated[extract]));
      };
      const performed = last.then(perform);
      last = performed;
    },
  };
}

export const dataApi = inMemoryDataApi<Root>({
  accounts: [],
});
