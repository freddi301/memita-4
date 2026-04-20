import {
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { updateContact } from "../queries/contacts";
import { StoreItem } from "../queries/Queries";
import { makeLocalStorage } from "./localStorage";
import { makeNetworkJsonCodec } from "./networkJSONCodec";
import { makeStore } from "./store";
import { websocketNetworkFactory } from "./websocketNetwork";

async function cleanLocalStorage() {
  const storage = makeLocalStorage("data");
  await storage.wipe();
  const mobileAccountId = "mobile-xxx";
  const mobileAccountName = "Mobile";
  const webAccountId = "web-xxx";
  const webAccountName = "Web";
  const accountId = Platform.select({
    web: webAccountId,
    default: mobileAccountId,
  });
  const insertions = [
    ...updateContact({
      accountId,
      contactId: mobileAccountId,
      name: mobileAccountName,
      deleted: false,
    })([]),
    ...updateContact({
      accountId,
      contactId: webAccountId,
      name: webAccountName,
      deleted: false,
    })([]),
  ];
  for (const item of insertions) {
    await storage.add(item);
  }
}

const store = makeStore<StoreItem>({
  storage: makeLocalStorage("data"),
  networkCodec: makeNetworkJsonCodec(),
  // networkFactory: bareNetworkFactory,
  networkFactory: websocketNetworkFactory,
  async onAdd(item) {
    subscriptions.forEach((callback) => callback());
  },
});

const subscriptions = new Set<() => void>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: "always",
      gcTime: 0,
    },
  },
});

export function useMemitaQuery<Params, Result>(
  queryFactory: (params: Params) => (all: Array<StoreItem>) => Result,
  params: Params,
): Result {
  return useSuspenseQuery(
    {
      queryKey: [queryFactory.name, params],
      async queryFn(): Promise<Result> {
        const all = await store.all();
        const result = queryFactory(params)(all);
        if (result === undefined) return null as unknown as Result;
        return result;
      },
    },
    queryClient,
  ).data;
}

export async function refreshMemitaQueries() {
  return queryClient.invalidateQueries();
}

export function useMemitaMutation<Params>(
  mutationFactory: (
    params: Params,
  ) => (all: Array<StoreItem>) => Array<StoreItem>,
): (params: Params) => Promise<void> {
  return useMutation(
    {
      async mutationFn(params: Params) {
        const all = await store.all();
        const newItems = mutationFactory(params)(all);
        for (const item of newItems) {
          await store.add(item);
        }
      },
      async onSuccess() {
        await queryClient.invalidateQueries();
      },
    },
    queryClient,
  ).mutateAsync;
}

export function useMemitaSubscription() {
  const [, setForceRerender] = useState(0);
  useEffect(() => {
    const callback = () => {
      refreshMemitaQueries();
      setForceRerender((prev) => prev + 1);
    };
    subscriptions.add(callback);
    return () => {
      subscriptions.delete(callback);
    };
  }, []);
}
