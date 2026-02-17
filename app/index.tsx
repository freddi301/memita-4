import { RouterProvider } from "@/components/Routing";
import { SelectAccountScreen } from "@/components/screens/SelectAccountScreen";
import { LogBox } from "react-native";
import { patchFlatListProps } from "react-native-web-refresh-control";

patchFlatListProps();

LogBox.ignoreLogs([/^Require cycle:/]);

export default function Index() {
  return <RouterProvider initial={<SelectAccountScreen />} />;
}
