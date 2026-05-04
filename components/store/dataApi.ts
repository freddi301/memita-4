import {
  QueryClient,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { use } from "react";
import { DataItem } from "../queries/Queries";
import { useCurrentScreenForceSuspend } from "../Routing";
import { AppStoreContext } from "./store";

// async function cleanLocalStorage() {
//   await deviceSettingsStore.wipe();
//   const storage = localStorageDBFactory("data", DataItemSchema.parse);
//   await storage.wipe();
//   const mobileAccountSecret = AccountSecretSchema.parse(
//     "984fa5157b2039e1ce05fe04ce1abf81def9f6bf0ea7406f16163058a138f54f",
//   );
//   const mobileAccountId = accountIdFromAccountSecret(mobileAccountSecret);
//   const mobileAccountName = "Mobile";
//   const webAccountSecret = AccountSecretSchema.parse(
//     "49ce6f7e6e684c9491c2eda6f6357fea8b53fc53585639bff0c30185d5e19e81",
//   );
//   const webAccountId = accountIdFromAccountSecret(webAccountSecret);
//   const webAccountName = "Web";
//   const accountSecret = Platform.select({
//     web: webAccountSecret,
//     default: mobileAccountSecret,
//   });
//   const accountId = accountIdFromAccountSecret(accountSecret);
//   await deviceSettingsStore.addAccount(accountSecret);
//   const insertions = [
//     ...updateContact({
//       accountId,
//       contactId: mobileAccountId,
//       name: mobileAccountName,
//       deleted: false,
//     })([]),
//     ...updateContact({
//       accountId,
//       contactId: webAccountId,
//       name: webAccountName,
//       deleted: false,
//     })([]),
//   ];
//   for (const item of insertions) {
//     await storage.add(item);
//   }
// }
// void cleanLocalStorage();

export function createMemitaQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        refetchOnMount: "always",
        gcTime: process.env.NODE_ENV === "test" ? Infinity : undefined,
      },
    },
  });
}

export function useMemitaQuery<Params, Result>(
  queryFactory: (params: Params) => (all: Array<DataItem>) => Result,
  params: Params,
): Result {
  const appStore = use(AppStoreContext);
  const queryClient = useQueryClient();
  const forceSuspend = useCurrentScreenForceSuspend();
  return useSuspenseQuery(
    {
      queryKey: [queryFactory.name, params, forceSuspend],
      async queryFn(): Promise<Result> {
        // await new Promise((resolve) => setTimeout(resolve, 500));
        const all = await appStore.all();
        const result = queryFactory(params)(all);
        if (result === undefined) return null as unknown as Result;
        return result;
      },
    },
    queryClient,
  ).data;
}

export function useRefreshMemitaQueries() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries();
  };
}

export function useMemitaMutation<Params>(
  mutationFactory: (
    params: Params,
  ) => (all: Array<DataItem>) => Array<DataItem>,
): (params: Params) => Promise<void> {
  const appStore = use(AppStoreContext);
  const queryClient = useQueryClient();
  return useMutation(
    {
      async mutationFn(params: Params) {
        // await new Promise((resolve) => setTimeout(resolve, 500));
        const all = await appStore.all();
        const newItems = mutationFactory(params)(all);
        for (const item of newItems) {
          await appStore.add(item);
        }
      },
      async onSuccess() {
        await queryClient.invalidateQueries();
      },
    },
    queryClient,
  ).mutateAsync;
}
