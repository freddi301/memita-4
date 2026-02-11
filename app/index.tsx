import { SelectAccountScreen } from "@/components/screens/SelectAccountScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "../components/Routing";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: "always",
      gcTime: 0,
    },
  },
});

export default function Index() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider initial={<SelectAccountScreen />} />;
    </QueryClientProvider>
  );
}
