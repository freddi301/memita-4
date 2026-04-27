import "react-native-get-random-values";
// polifills first
import { SelectAccountScreen } from "@/components/screens/SelectAccountScreen";
import { useEffect } from "react";
import { patchFlatListProps } from "react-native-web-refresh-control";
import { registerForPushNotificationsAsync } from "../components/notifications";
import { RouterRoot } from "../components/Routing";

patchFlatListProps();

export default function Index() {
  useEffect(() => {
    void registerForPushNotificationsAsync();
  }, []);
  return <RouterRoot initial={<SelectAccountScreen />} />;
}
