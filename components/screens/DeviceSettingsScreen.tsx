import { useLingui } from "@lingui/react/macro";
import { Fragment, startTransition } from "react";
import { ScrollView, Text, View } from "react-native";
import { systemLanguage } from "../../app/index";
import { ScreenLink } from "../Routing";
import { Language, useDeviceSettings } from "../store/deviceSettingsStorage";
import { languages } from "../store/languages";
import { useTheme } from "../Theme";
import { Select } from "../ui/Select";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function DeviceSettingsScreen() {
  const { t } = useLingui();
  const theme = useTheme();

  const deviceSettings = useDeviceSettings();

  return (
    <Fragment>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <ScreenLink
          to={<SelectAccountScreen />}
          icon="arrow-left"
          hideLabel
          label={t`Back`}
        />
        <Text style={{ ...theme.textStyle, fontWeight: "bold" }}>
          {t`Device Settings`}
        </Text>
      </View>
      <ScrollView>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>{t`Language`}</Text>
          <Select
            options={[undefined, ...languages]}
            value={deviceSettings.language}
            onChange={(language) => {
              startTransition(async () => {
                await deviceSettings.setLanguage(language);
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
      </ScrollView>
    </Fragment>
  );
}
