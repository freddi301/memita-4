import { View } from "react-native";
import { ScreenLink } from "../Routing";
import { ArticlesScreen } from "../screens/ArticlesScreen";
import { DirectMessagesScreen } from "../screens/DirectMessagesScreen";
import { GroupMessagesScreen } from "../screens/GroupMessagesScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
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
        to={enabled ? <GroupMessagesScreen accountId={accountId} /> : undefined}
        icon="group"
        hideLabel
        label={translate({
          en: "Group messages",
          it: "Messaggi di gruppo",
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
        to={
          enabled ? (
            <ProfileScreen accountId={accountId} contactId={accountId} />
          ) : undefined
        }
        icon="user"
        hideLabel
        label={translate({
          en: "Profile",
          it: "Profilo",
        })}
      />
    </View>
  );
}
