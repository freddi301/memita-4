import { useLingui } from "@lingui/react/macro";
import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { AccountId } from "../cryptography/cryptography";
import { getDirectMessagesSummary } from "../queries/directMessages";
import { ScreenLink } from "../Routing";
import { useMemitaQuery, useRefreshMemitaQueries } from "../store/dataApi";
import { useTheme } from "../Theme";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { CryptoAvatar } from "../ui/CryptoAvatar";
import { ContactScreen } from "./ContactScreen";
import { DirectConversationScreen } from "./DirectConversationScreen";

export function DirectMessagesScreen({ accountId }: { accountId: AccountId }) {
  const { t } = useLingui();
  const theme = useTheme();
  const refreshMemitaQueries = useRefreshMemitaQueries();

  const conversations = useMemitaQuery(getDirectMessagesSummary, { accountId });

  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flexGrow: 1 }} />
        <ScreenLink
          to={<ContactScreen accountId={accountId} />}
          icon="user-plus"
          label={t`Create new contact`}
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
              styleOverride={{
                flexDirection: "row",
                paddingHorizontal: 8,
                marginVertical: 4,
                gap: 8,
                flexGrow: 1,
              }}
            >
              <CryptoAvatar accountId={accountId} contactId={item.contactId} />
              <View style={{ flexGrow: 1 }}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ ...theme.linkTextStyle, flexGrow: 1 }}>
                    {item.contactName}
                  </Text>
                  {item.lastMesssageCreatedAt && (
                    <Text
                      style={{
                        ...theme.textStyle,
                        color: theme.secondaryTextColor,
                        alignSelf: "flex-end",
                      }}
                    >
                      {new Date(item.lastMesssageCreatedAt).toLocaleString()}
                    </Text>
                  )}
                </View>
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-end" }}
                >
                  {item.unread > 0 && (
                    <Text
                      style={{
                        ...theme.textStyle,
                        fontWeight: "bold",
                        backgroundColor: theme.linkTextColor,
                        color: theme.backgroundColor,
                        paddingHorizontal: 4,
                        borderRadius: 8,
                        minWidth: 24,
                        textAlign: "center",
                      }}
                    >
                      {item.unread}
                    </Text>
                  )}
                </View>
              </View>
            </ScreenLink>
          </View>
        )}
        style={{ flex: 1, marginVertical: 8 }}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={() => (
          <Text style={{ ...theme.secondaryTextStyle, textAlign: "center" }}>
            {t`No messages`}
          </Text>
        )}
        refreshing={false}
        onRefresh={refreshMemitaQueries}
      />
      <BottomTabNavigation accountId={accountId} enabled={true} />
    </Fragment>
  );
}
