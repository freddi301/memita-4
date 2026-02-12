import { Platform, View } from "react-native";
import { ScreenLink } from "../Routing";
import { AccountScreen } from "../screens/AccountScreen";
import { ArticlesScreen } from "../screens/ArticlesScreen";
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
        paddingBottom: Platform.OS === "web" ? 8 : 0,
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
        to={<ArticlesScreen accountId={accountId} />}
        icon="newspaper-o"
        hideLabel
        label="newspaper"
        enabled={enabled}
      />
      <ScreenLink
        to={null}
        icon="calendar"
        hideLabel
        label="eventi"
        enabled={false}
      />
      <ScreenLink
        to={null}
        icon="map-marker"
        hideLabel
        label="posti"
        enabled={false}
      />
      <ScreenLink
        to={null}
        icon="bell"
        hideLabel
        label="notifiche"
        enabled={false}
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
