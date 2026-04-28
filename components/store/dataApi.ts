import {
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Platform } from "react-native";
import {
  accountIdFromAccountSecret,
  AccountSecretSchema,
} from "../cryptography/cryptography";
import { networkDummy } from "../network/netoworkDummy";
import { bareNetworkFactory } from "../network/networkBare";
import { websocketNetworkFactory } from "../network/networkWebsocketClient";
import { triggerNotification } from "../notifications";
import { updateContact } from "../queries/contacts";
import {
  directMessagesList,
  directMessagesSummary,
} from "../queries/directMessages";
import { StoreItem, StoreItemSchema } from "../queries/Queries";
import { shouldSend } from "../queries/shouldSend";
import { useCurrentScreenForceSuspend } from "../Routing";
import { deviceSettingsStore } from "./deviceSettingsStorage";
import { localStorageFactory } from "./localStorage";
import { makeStore } from "./store";

async function cleanLocalStorage() {
  await deviceSettingsStore.wipe();
  const storage = localStorageFactory("data", StoreItemSchema.parse);
  await storage.wipe();
  const mobileAccountSecret = AccountSecretSchema.parse(
    "984fa5157b2039e1ce05fe04ce1abf81def9f6bf0ea7406f16163058a138f54f",
  );
  const mobileAccountId = accountIdFromAccountSecret(mobileAccountSecret);
  const mobileAccountName = "Mobile";
  const webAccountSecret = AccountSecretSchema.parse(
    "49ce6f7e6e684c9491c2eda6f6357fea8b53fc53585639bff0c30185d5e19e81",
  );
  const webAccountId = accountIdFromAccountSecret(webAccountSecret);
  const webAccountName = "Web";
  const accountSecret = Platform.select({
    web: webAccountSecret,
    default: mobileAccountSecret,
  });
  const accountId = accountIdFromAccountSecret(accountSecret);
  await deviceSettingsStore.addAccount(accountSecret);
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

const store = makeStore<StoreItem>({
  parse: StoreItemSchema.parse,
  storage: localStorageFactory("data", StoreItemSchema.parse),
  // networkFactory: websocketNetworkFactory,
  networkFactory:
    process.env.NODE_ENV === "test"
      ? networkDummy
      : Platform.OS === "web"
        ? websocketNetworkFactory
        : bareNetworkFactory,
  async onAdd(item) {
    // TODO make these more efficient and selective and come up with a thing to express that it is a live query at callsite
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [directMessagesList.name] }),
      queryClient.invalidateQueries({ queryKey: [directMessagesSummary.name] }),
    ]);
    await triggerNotification();
  },
  shouldSend,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: "always",
      gcTime: process.env.NODE_ENV === "test" ? Infinity : undefined,
    },
  },
});
export function useMemitaQuery<Params, Result>(
  queryFactory: (params: Params) => (all: Array<StoreItem>) => Result,
  params: Params,
): Result {
  const forceSuspend = useCurrentScreenForceSuspend();
  return useSuspenseQuery(
    {
      queryKey: [queryFactory.name, params, forceSuspend],
      async queryFn(): Promise<Result> {
        // await new Promise((resolve) => setTimeout(resolve, 500));
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
  await queryClient.invalidateQueries();
}

export function useMemitaMutation<Params>(
  mutationFactory: (
    params: Params,
  ) => (all: Array<StoreItem>) => Array<StoreItem>,
): (params: Params) => Promise<void> {
  return useMutation(
    {
      async mutationFn(params: Params) {
        // await new Promise((resolve) => setTimeout(resolve, 500));
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
