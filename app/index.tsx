import { SelectAccountScreen } from "@/components/screens/SelectAccountScreen";
import { RouterProvider } from "../components/Routing";

export default function Index() {
  return <RouterProvider initial={<SelectAccountScreen />} />;
}
