import "react-native-get-random-values";
// polifills first
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import * as Localization from "expo-localization";
import { useEffect, useLayoutEffect } from "react";
import { patchFlatListProps } from "react-native-web-refresh-control";
import { registerForPushNotificationsAsync } from "../components/notifications";
import { RouterRoot } from "../components/Routing";
import { SelectAccountScreen } from "../components/screens/SelectAccountScreen";
import {
  Language,
  LanguageSchema,
  useDeviceSettings,
} from "../components/store/deviceSettingsStorage";
import { languages } from "../components/store/languages";
import { messages as enMessages } from "../locales/en/messages";
import { messages as itMessages } from "../locales/it/messages";

patchFlatListProps();

export const systemLanguage = LanguageSchema.parse(
  Localization.getLocales().find((l) =>
    languages.includes(l.languageCode as any),
  )?.languageCode ?? "en",
);

function switchLanguage(language: Language) {
  i18n.loadAndActivate({
    locale: language,
    messages: (() => {
      switch (language) {
        case "en":
          return enMessages;
        case "it":
          return itMessages;
      }
    })(),
  });
}

switchLanguage(systemLanguage);

export default function Index() {
  useEffect(() => {
    void registerForPushNotificationsAsync();
  }, []);
  const deviceSettings = useDeviceSettings();
  const currentLanguage = deviceSettings.language ?? systemLanguage;
  useLayoutEffect(() => {
    switchLanguage(currentLanguage);
  }, [currentLanguage]);
  return (
    <I18nProvider i18n={i18n}>
      <RouterRoot initial={<SelectAccountScreen />} />
    </I18nProvider>
  );
}
