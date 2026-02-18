import { RouterProvider } from "@/components/Routing";
import { SelectAccountScreen } from "@/components/screens/SelectAccountScreen";
import { patchFlatListProps } from "react-native-web-refresh-control";

patchFlatListProps();

export default function Index() {
  return <RouterProvider initial={<SelectAccountScreen />} />;
}
