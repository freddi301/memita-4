import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { refreshMemitaQueries, useMemitaQuery } from "../persistance/dataApi";
import { directMessagesSummary } from "../queries/directMessages";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { ContactScreen } from "./ContactScreen";
import { DirectConversationScreen } from "./DirectConversationScreen";

export function DirectMessagesScreen({ accountId }: { accountId: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const conversations = useMemitaQuery(directMessagesSummary, { accountId });

  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flexGrow: 1 }} />
        <ScreenLink
          to={<ContactScreen accountId={accountId} />}
          icon="user-plus"
          label={translate({
            en: "Create new contact",
            it: "Crea nuovo contatto",
          })}
        />
      </View>
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ScreenLink
              to={
                <DirectConversationScreen
                  accountId={accountId}
                  contactId={item.contactId}
                />
              }
              label={item.contactName}
              icon="circle"
              styleOverride={{
                flexGrow1: true,
              }}
            />
            {item.createdAt ? (
              <Text style={{ ...theme.textStyle, paddingRight: 4 }}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            ) : null}
            <Text
              style={{
                ...theme.textStyle,
                fontWeight: "bold",
                backgroundColor: theme.linkTextColor,
                color: theme.backgroundColor,
                paddingHorizontal: 4,
                borderRadius: 4,
                marginHorizontal: 4,
                minWidth: 24,
                textAlign: "center",
                visibility: item.unread > 0 ? "visible" : "hidden",
              }}
            >
              {item.unread}
            </Text>
          </View>
        )}
        style={{ flex: 1, marginVertical: 8 }}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={() => (
          <Text
            style={{
              ...theme.secondaryTextStyle,
              textAlign: "center",
            }}
          >
            {translate({
              en: "No messages",
              it: "Nessun messagio",
            })}
          </Text>
        )}
        refreshing={false}
        onRefresh={refreshMemitaQueries}
      />
      <BottomTabNavigation accountId={accountId} enabled={true} />
    </Fragment>
  );
}
