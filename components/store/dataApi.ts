import { QueryClient, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { AccountIdSchema } from "../cryptography/cryptography";
import { bareNetworkFactory } from "../network/networkBare";
import { websocketNetworkFactory } from "../network/networkWebsocketClient";
import { triggerNotification } from "../notifications";
import { updateContact } from "../queries/contacts";
import { StoreItem, StoreItemSchema } from "../queries/Queries";
import { localStorageFactory } from "./localStorage";
import { makeStore } from "./store";

async function cleanLocalStorage() {
  const storage = localStorageFactory("data", StoreItemSchema.parse);
  await storage.wipe();
  const mobileAccountId = AccountIdSchema.parse("984fa5157b2039e1ce05fe04ce1abf81def9f6bf0ea7406f16163058a138f54f");
  const mobileAccountName = "Mobile";
  const webAccountId = AccountIdSchema.parse("49ce6f7e6e684c9491c2eda6f6357fea8b53fc53585639bff0c30185d5e19e81");
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
// void cleanLocalStorage();

export const store = makeStore<StoreItem>({
  parse: StoreItemSchema.parse,
  storage: localStorageFactory("data", StoreItemSchema.parse),
  // networkFactory: websocketNetworkFactory,
  networkFactory: Platform.OS === "web" ? websocketNetworkFactory : bareNetworkFactory,
  async onAdd(item) {
    subscriptions.forEach((callback) => callback());
    await triggerNotification();
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
  mutationFactory: (params: Params) => (all: Array<StoreItem>) => Array<StoreItem>,
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

// TODO remove this somehow
export function useMemitaSubscription() {
  const [, setForceRerender] = useState(0);
  useEffect(() => {
    const callback = () => {
      void refreshMemitaQueries();
      setForceRerender((prev) => prev + 1);
    };
    subscriptions.add(callback);
    return () => {
      subscriptions.delete(callback);
    };
  }, []);
}
