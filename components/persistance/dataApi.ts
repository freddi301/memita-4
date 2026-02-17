import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { initialRoot, Root } from "../queries/queries";
import { queryClient } from "../queryClient";
import { Collection } from "./helpers";

// AsyncStorage.removeItem("data");

async function load(): Promise<Root> {
  const data = await AsyncStorage.getItem("data");
  if (data) {
    return JSON.parse(data);
  }
  return initialRoot;
}

async function save(data: Root): Promise<void> {
  await AsyncStorage.setItem("data", JSON.stringify(data));
}

export function useMemitaQuery<Params, Result>(
  queryFactory: (params: Params) => (root: Root) => Collection<Result>,
  params: Params
): Array<Result> {
  return useSuspenseQuery(
    {
      queryKey: [queryFactory.name, params],
      async queryFn(): Promise<Array<Result>> {
        const data = await load();
        return queryFactory(params)(data).__array;
      },
    },
    queryClient
  ).data;
}

export async function refreshMemitaQueries() {
  return queryClient.invalidateQueries();
}

export function useMemitaMutation<Params>(
  mutationFactory: (params: Params) => (root: Root) => Root
): (params: Params) => Promise<void> {
  return useMutation(
    {
      async mutationFn(params: Params) {
        const data = await load();
        const newData = mutationFactory(params)(data);
        await save(newData);
      },
      async onSuccess() {
        await queryClient.invalidateQueries();
      },
    },
    queryClient
  ).mutateAsync;
}
