import { useLingui } from "@lingui/react/macro";
import { Fragment, startTransition } from "react";
import { ScrollView, Text, View } from "react-native";
import { languages } from "../i18n/languages";
import { getLanguage, setLanguage, systemLanguage } from "../i18n/Memitai18n";
import { Language, Theme, themes } from "../storage/storageSchema";
import { useMemitaMutation, useMemitaQuery } from "../store/dataApi";
import { getTheme, setTheme, useSystemTheme, useTheme } from "../Theme";
import { BackIcon } from "../ui/Icon";
import { ScreenLink } from "../ui/ScreenLink";
import { Select } from "../ui/Select";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function DeviceSettingsScreen() {
  const { t } = useLingui();
  const theme = useTheme();
  const systemTheme = useSystemTheme();

  const savedLanguage = useMemitaQuery(getLanguage, undefined);
  const setLanguageMutation = useMemitaMutation(setLanguage);

  const savedTheme = useMemitaQuery(getTheme, undefined);
  const setThemeMutation = useMemitaMutation(setTheme);

  return (
    <Fragment>
      <View style={[{ flexDirection: "row", alignItems: "center" }]}>
        <ScreenLink
          to={<SelectAccountScreen />}
          icon={BackIcon}
          hideLabel
          label={t`Back`}
        />
        <Text style={[theme.textStyle, { fontWeight: "bold", paddingTop: 2 }]}>
          {t`Device Settings`}
        </Text>
      </View>
      <ScrollView>
        <View style={[theme.formFieldContainerStyle]}>
          <Text style={[theme.secondaryTextStyle]}>{t`Language`}</Text>
          <Select
            options={[undefined, ...languages]}
            value={savedLanguage}
            onChange={(language) => {
              startTransition(async () => {
                await setLanguageMutation(language);
              });
            }}
            renderValue={(language) => {
              const getLanguageName = (language: Language) => {
                switch (language) {
                  case "en":
                    return "🇬🇧 " + t`English`;
                  case "zh":
                    return "🇨🇳 " + t`Mandarin Chinese`;
                  case "es":
                    return "🇪🇸 " + t`Spanish`;
                  case "hi":
                    return "🇮🇳 " + t`Hindi`;
                  case "bn":
                    return "🇧🇩 " + t`Bengali`;
                  case "pt":
                    return "🇵🇹 " + t`Portuguese`;
                  case "ru":
                    return "🇷🇺 " + t`Russian`;
                  case "ja":
                    return "🇯🇵 " + t`Japanese`;
                  case "vi":
                    return "🇻🇳 " + t`Vietnamese`;
                  case "tr":
                    return "🇹🇷 " + t`Turkish`;
                  case "mr":
                    return "🇮🇳 " + t`Marathi`;
                  case "te":
                    return "🇮🇳 " + t`Telugu`;
                  case "ko":
                    return "🇰🇷 " + t`Korean`;
                  case "fr":
                    return "🇫🇷 " + t`French`;
                  case "ta":
                    return "🇱🇰 " + t`Tamil`;
                  case "ar":
                    return "🇸🇦 " + t`Arabic`;
                  case "de":
                    return "🇩🇪 " + t`German`;
                  case "ur":
                    return "🇵🇰 " + t`Urdu`;
                  case "jv":
                    return "🇮🇩 " + t`Javanese`;
                  case "it":
                    return "🇮🇹 " + t`Italian`;
                  // case "th":
                  //   return "🇹🇭 " + t`Thai`;
                  // case "gu":
                  //   return "🇮🇳 " + t`Gujarati`;
                  // case "ha":
                  //   return "🇳🇬 " + t`Hausa`;
                  // case "kn":
                  //   return "🇮🇳 " + t`Kannada`;
                  // case "fa":
                  //   return "🇮🇷 " + t`Persian`;
                  // case "pl":
                  //   return "🇵🇱 " + t`Polish`;
                  // case "id":
                  //   return "🇮🇩 " + t`Indonesian`;
                  // case "sw":
                  //   return "🇰🇪 " + t`Swahili`;
                }
              };
              const languageName = language
                ? getLanguageName(language)
                : getLanguageName(systemLanguage);
              return language
                ? languageName
                : t`System default (${languageName})`;
            }}
          />
        </View>
        <View style={[theme.formFieldContainerStyle]}>
          <Text style={[theme.secondaryTextStyle]}>{t`Theme`}</Text>
          <Select
            options={[undefined, ...themes]}
            value={savedTheme}
            onChange={(nextTheme) => {
              startTransition(async () => {
                await setThemeMutation(nextTheme);
              });
            }}
            renderValue={(nextTheme) => {
              function getThemeName(nextTheme: Theme) {
                switch (nextTheme) {
                  case "light":
                    return t`Light`;
                  case "dark":
                    return t`Dark`;
                }
              }
              const themeName = nextTheme
                ? getThemeName(nextTheme)
                : getThemeName(systemTheme);
              return nextTheme ? themeName : t`System default (${themeName})`;
            }}
          />
        </View>
      </ScrollView>
    </Fragment>
  );
}
