import "react-native-get-random-values";
// polifills first
import { SelectAccountScreen } from "@/components/screens/SelectAccountScreen";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useEffect } from "react";
import { patchFlatListProps } from "react-native-web-refresh-control";
import { registerForPushNotificationsAsync } from "../components/notifications";
import { RouterRoot } from "../components/Routing";
import { messages } from "../locales/en/messages";

patchFlatListProps();

i18n.loadAndActivate({ locale: "en", messages });

export default function Index() {
  useEffect(() => {
    void registerForPushNotificationsAsync();
  }, []);
  return (
    <I18nProvider i18n={i18n}>
      <RouterRoot initial={<SelectAccountScreen />} />
    </I18nProvider>
  );
}
