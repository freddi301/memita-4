import {
  QueryClient,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { use } from "react";
import { useCurrentScreenForceSuspend } from "../Routing";
import { FeApiContext, MemitaMutation, MemitaQuery } from "./feApi";

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
  queryFactory: MemitaQuery<Params, Result>,
  params: Params,
): Result {
  const feApi = use(FeApiContext);
  const queryClient = useQueryClient();
  const forceSuspend = useCurrentScreenForceSuspend();
  return useSuspenseQuery(
    {
      queryKey: [queryFactory.name, params, forceSuspend],
      async queryFn(): Promise<Result> {
        // await new Promise((resolve) => setTimeout(resolve, 500));
        const result = await queryFactory(params)(feApi);
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
  mutationFactory: MemitaMutation<Params>,
): (params: Params) => Promise<void> {
  const feApi = use(FeApiContext);

  const queryClient = useQueryClient();
  return useMutation(
    {
      async mutationFn(params: Params) {
        // await new Promise((resolve) => setTimeout(resolve, 500));
        await mutationFactory(params)(feApi);
      },
      async onSuccess() {
        await queryClient.invalidateQueries();
      },
    },
    queryClient,
  ).mutateAsync;
}
