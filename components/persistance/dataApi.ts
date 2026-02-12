import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { initialRoot, Root } from "../queries/queries";
import { queryClient } from "../queryClient";
import { dataToQuery, extract, Plain, Query } from "./QL";

// function asyncStorageDataApi<Data extends Plain>(initial: Data): DataApi<Data> {
//   let last: Promise<any> = Promise.resolve();
//   return {
//     async read(query) {
//       const perform = async () => {
//         // await new Promise((resolve) => setTimeout(resolve, 1000));
//         const json = await AsyncStorage.getItem("data");
//         return json ? JSON.parse(json) : initial;
//       };
//       const performed = last.then(perform);
//       return performed;
//     },
//     async write(query) {
//       const perform = async () => {
//         // await new Promise((resolve) => setTimeout(resolve, 1000));
//         const json = await AsyncStorage.getItem("data");
//         const updated = query(json ? JSON.parse(json) : initial);
//         await AsyncStorage.setItem("data", JSON.stringify(updated));
//       };
//       const performed = last.then(perform);
//       last = performed;
//     },
//     async wipe() {
//       await AsyncStorage.removeItem("data");
//     },
//   };
// }

// const dataApi = asyncStorageDataApi(initialRoot);

// dataApi.wipe();

export function useMemitaQuery<Params extends Plain, Result extends Plain>(
  queryFactory: (params: Params) => Query<Result>,
  params: Params
): Result {
  return useSuspenseQuery(
    {
      queryKey: [queryFactory.name, params],
      async queryFn() {
        console.log(repo.data);
        const result = queryFactory(params)[extract];
        return result;
      },
    },
    queryClient
  ).data as Result;
}

export function useMemitaMutation<Params extends Record<string, Plain>>(
  mutationFactory: (params: Params) => Query<Root>
): (params: Params) => Promise<void> {
  return useMutation(
    {
      async mutationFn(params: Params) {
        const updated = mutationFactory(params)[extract];
        repo.data = updated;
      },
    },
    queryClient
  ).mutateAsync;
}

const repo = {
  data: initialRoot,
};

export const root: Query<Root> = new Proxy(
  {},
  {
    get(target, prop) {
      return dataToQuery(repo.data)[prop as keyof Query<Root>];
    },
  }
) as any;
