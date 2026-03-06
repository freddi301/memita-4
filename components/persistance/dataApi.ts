import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { initialRoot, Root } from "../queries/queries";
import { queryClient } from "../queryClient";
import { collection, Collection } from "./helpers";

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

export type RootCollections = {
  [K in keyof Root]: Collection<Root[K] extends Array<infer U> ? U : never>;
};

function makeRootCollections(root: Root): RootCollections {
  return Object.fromEntries(
    Object.entries(root).map(([key, value]) => [
      key,
      collection(value as any) as any,
    ])
  ) as RootCollections;
}

function makeRoot(collections: RootCollections): Root {
  return Object.fromEntries(
    Object.entries(collections).map(([key, value]) => [key, value.__array])
  ) as Root;
}

export function useMemitaQuery<Params, Result>(
  queryFactory: (
    params: Params
  ) => (rootCollections: RootCollections) => Collection<Result>,
  params: Params
): Array<Result> {
  return useSuspenseQuery(
    {
      queryKey: [queryFactory.name, params],
      async queryFn(): Promise<Array<Result>> {
        const data = await load();
        return queryFactory(params)(makeRootCollections(data)).__array;
      },
    },
    queryClient
  ).data;
}

export async function refreshMemitaQueries() {
  return queryClient.invalidateQueries();
}

export function useMemitaMutation<Params>(
  mutationFactory: (
    params: Params
  ) => (rootCollections: RootCollections) => RootCollections
): (params: Params) => Promise<void> {
  return useMutation(
    {
      async mutationFn(params: Params) {
        const data = await load();
        const newData = mutationFactory(params)(makeRootCollections(data));
        await save(makeRoot(newData));
      },
      async onSuccess() {
        await queryClient.invalidateQueries();
      },
    },
    queryClient
  ).mutateAsync;
}
