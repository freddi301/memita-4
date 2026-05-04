import { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import * as Localization from "expo-localization";
import { useLayoutEffect } from "react";
import { Language, LanguageSchema } from "../storage/storageSchema";
import { useDeviceSettings } from "../store/deviceSettingsStorage";
import { languages } from "./languages";
import { messages as enMesssages } from "./locales/en/messages";
import { messages as itMessages } from "./locales/it/messages";

export const systemLanguage = LanguageSchema.parse(
  Localization.getLocales().find((l) =>
    languages.includes(l.languageCode as any),
  )?.languageCode ?? "en",
);

const loadMessages = (language: Language) => {
  switch (language) {
    case "en":
      return enMesssages;
    case "it":
      return itMessages;
  }
};

export function Memitai18n({
  i18n,
  children,
}: {
  i18n: I18n;
  children: React.ReactNode;
}) {
  const deviceSettings = useDeviceSettings();
  const currentLanguage = deviceSettings.language ?? systemLanguage;
  const messages = loadMessages(currentLanguage);
  useLayoutEffect(() => {
    i18n.loadAndActivate({ locale: currentLanguage, messages });
  }, [currentLanguage, i18n, messages]);
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
