import { useLingui } from "@lingui/react/macro";
import { Fragment, startTransition } from "react";
import { ScrollView, Text, View } from "react-native";
import { languages } from "../i18n/languages";
import { getLanguage, setLanguage, systemLanguage } from "../i18n/Memitai18n";
import { ScreenLink } from "../Routing";
import { Language, Theme, themes } from "../storage/storageSchema";
import { useMemitaMutation, useMemitaQuery } from "../store/dataApi";
import { getTheme, setTheme, useSystemTheme, useTheme } from "../Theme";
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
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <ScreenLink
          to={<SelectAccountScreen />}
          icon="arrow-left"
          hideLabel
          label={t`Back`}
        />
        <Text style={{ ...theme.textStyle, fontWeight: "bold", paddingTop: 2 }}>
          {t`Device Settings`}
        </Text>
      </View>
      <ScrollView>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>{t`Language`}</Text>
          <Select
            options={[undefined, ...languages]}
            value={savedLanguage}
            onChange={(language) => {
              startTransition(async () => {
                await setLanguageMutation(language);
              });
            }}
            renderValue={(language) => {
              function getLanguageName(language: Language) {
                switch (language) {
                  case "en":
                    return t`English`;
                  case "it":
                    return t`Italian`;
                }
              }
              const languageName = language
                ? getLanguageName(language)
                : getLanguageName(systemLanguage);
              return language
                ? languageName
                : t`System default (${languageName})`;
            }}
          />
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>{t`Theme`}</Text>
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
