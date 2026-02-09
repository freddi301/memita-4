import { Text, View } from "react-native";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function AccountScreen({ accountId }: { accountId: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();
  return (
    <View>
      <ScreenLink
        to={<SelectAccountScreen />}
        label={translate({
          en: "Select another account",
          it: "Seleziona un altro account",
        })}
      />
      <Text style={theme.textStyle}>{accountId}</Text>
    </View>
  );
}
