import { RouterProvider } from "@/components/Routing";
import { SelectAccountScreen } from "@/components/screens/SelectAccountScreen";

export default function Index() {
  return <RouterProvider initial={<SelectAccountScreen />} />;
}
