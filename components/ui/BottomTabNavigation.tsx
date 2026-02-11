import { View } from "react-native";
import { ScreenLink } from "../Routing";
import { AccountScreen } from "../screens/AccountScreen";
import { DirectMessagesScreen } from "../screens/DirectMessagesScreen";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";

export function BottomTabNavigation({
  accountId,
  enabled = true,
}: {
  accountId: string;
  enabled?: boolean;
}) {
  const { translate } = useTranslate();
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        borderTopWidth: 1,
        borderColor: theme.separatorColor,
        paddingTop: 8,
      }}
    >
      <ScreenLink
        to={<DirectMessagesScreen accountId={accountId} />}
        icon="inbox"
        hideLabel
        label={translate({
          en: "Direct messages",
          it: "Messaggi diretti",
        })}
        enabled={enabled}
      />
      <ScreenLink
        to={<AccountScreen accountId={accountId} />}
        icon="user"
        hideLabel
        label={translate({
          en: "Account details",
          it: "Dettagli account",
        })}
        enabled={enabled}
      />
    </View>
  );
}
