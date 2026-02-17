import { View } from "react-native";
import { ScreenLink } from "../Routing";
import { AccountScreen } from "../screens/AccountScreen";
import { ArticlesScreen } from "../screens/ArticlesScreen";
import { DirectMessagesScreen } from "../screens/DirectMessagesScreen";
import { useTranslate } from "../Translate";

export function BottomTabNavigation({
  accountId,
  enabled = true,
}: {
  accountId: string;
  enabled?: boolean;
}) {
  const { translate } = useTranslate();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        paddingTop: 8,
      }}
    >
      <ScreenLink
        to={
          enabled ? <DirectMessagesScreen accountId={accountId} /> : undefined
        }
        icon="inbox"
        hideLabel
        label={translate({
          en: "Direct messages",
          it: "Messaggi diretti",
        })}
      />
      <ScreenLink
        to={enabled ? <ArticlesScreen accountId={accountId} /> : undefined}
        icon="newspaper-o"
        hideLabel
        label="newspaper"
      />
      <ScreenLink to={null} icon="calendar" hideLabel label="eventi" />
      <ScreenLink to={null} icon="map-marker" hideLabel label="posti" />
      <ScreenLink
        to={enabled ? <AccountScreen accountId={accountId} /> : undefined}
        icon="user"
        hideLabel
        label={translate({
          en: "Account details",
          it: "Dettagli account",
        })}
      />
    </View>
  );
}
