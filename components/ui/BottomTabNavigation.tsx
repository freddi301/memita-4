import { View } from "react-native";
import { ScreenLink } from "../Routing";
import { ArticlesScreen } from "../screens/ArticlesScreen";
import { DirectMessagesScreen } from "../screens/DirectMessagesScreen";
import { EventsScreen } from "../screens/EventsScreen";
import { GroupMessagesScreen } from "../screens/GroupMessagesScreen";
import { PlacesScreen } from "../screens/PlacesScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { useTranslate } from "../Translate";

export function BottomTabNavigation({
  accountId,
  enabled,
}: {
  accountId: string;
  enabled: boolean;
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
      <ScreenLink
        to={enabled ? <EventsScreen accountId={accountId} /> : undefined}
        icon="calendar"
        hideLabel
        label={translate({
          en: "Events",
          it: "Eventi",
        })}
      />
      <ScreenLink
        to={enabled ? <PlacesScreen accountId={accountId} /> : undefined}
        icon="map-marker"
        hideLabel
        label={translate({
          en: "Places",
          it: "Luoghi",
        })}
      />
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
