import { registerForPushNotificationsAsync } from "@/components/notifications";
import { RouterProvider } from "@/components/Routing";
import { SelectAccountScreen } from "@/components/screens/SelectAccountScreen";
import { useEffect } from "react";
import { patchFlatListProps } from "react-native-web-refresh-control";

patchFlatListProps();

export default function Index() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);
  return <RouterProvider initial={<SelectAccountScreen />} />;
}
