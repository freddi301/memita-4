import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { AccountId } from "../cryptography/cryptography";
import { groupMessagesSummary } from "../queries/groupMessages";
import { ScreenLink } from "../Routing";
import { refreshMemitaQueries, useMemitaQuery } from "../store/dataApi";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { GroupConversationScreen } from "./GroupConversationScreen";
import { GroupScreen } from "./GroupScreen";

export function GroupMessagesScreen({ accountId }: { accountId: AccountId }) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const conversations = useMemitaQuery(groupMessagesSummary, { accountId });

  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flexGrow: 1 }} />
        <ScreenLink
          to={<GroupScreen accountId={accountId} />}
          icon="plus"
          label={translate({
            en: "Create new group",
            it: "Crea nuovo gruppo",
          })}
        />
      </View>
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ScreenLink
              to={
                <GroupConversationScreen
                  accountId={accountId}
                  groupId={item.groupId}
                />
              }
              label={item.groupName}
              icon="circle"
              styleOverride={{
                flexGrow1: true,
              }}
            />
            {item.lastMessageCreatedAt ? (
              <Text style={{ ...theme.textStyle, paddingRight: 16 }}>
                {new Date(item.lastMessageCreatedAt).toLocaleString()}
              </Text>
            ) : null}
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
