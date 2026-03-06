import { FontAwesome } from "@expo/vector-icons";
import { Fragment, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import {
  refreshMemitaQueries,
  useMemitaMutation,
  useMemitaQuery,
} from "../persistance/dataApi";
import { accountLatest } from "../queries/accounts";
import { contactLatest } from "../queries/contacts";
import {
  directMessagesList,
  updateDidReadDirectMessage,
  updateDirectMessage,
} from "../queries/directMessages";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { MessageCompose } from "../ui/MessageCompose";
import { DirectMessagesScreen } from "./DirectMessagesScreen";
import { ProfileScreen } from "./ProfileScreen";

export function DirectConversationScreen({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId: string;
}) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const account = useMemitaQuery(accountLatest, { accountId })[0];
  const contact = useMemitaQuery(contactLatest, { accountId, contactId })[0];
  const conversation = useMemitaQuery(directMessagesList, {
    accountId,
    contactId,
  });

  const send = useMemitaMutation(updateDirectMessage);

  const didRead = useMemitaMutation(updateDidReadDirectMessage);

  const [toModifyMessage, setToModifyMessage] = useState<
    | undefined
    | {
        createdAt: number;
        content: string;
      }
  >();

  return (
    <Fragment>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ScreenLink
          to={<DirectMessagesScreen accountId={accountId} />}
          icon="arrow-left"
          hideLabel
          label={translate({
            en: "Go to messages",
            it: "Vai ai messaggi",
          })}
        />
        <ScreenLink
          to={<ProfileScreen accountId={accountId} contactId={contactId} />}
          icon="user"
          label={contact?.name ?? ""}
          styleOverride={{
            flexGrow1: true,
          }}
        />
      </View>
      <FlatList
        data={conversation}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => {
              if (item.senderId === accountId) {
                setToModifyMessage(
                  item.createdAt === toModifyMessage?.createdAt
                    ? undefined
                    : {
                        createdAt: item.createdAt,
                        content: item.content,
                      }
                );
              }
            }}
            onPress={() => {
              if (item.receiverId === accountId) {
                didRead({
                  senderId: item.senderId,
                  receiverId: item.receiverId,
                  createdAt: item.createdAt,
                  didRead: !item.didRead,
                });
              }
            }}
            style={{
              backgroundColor:
                item.createdAt === toModifyMessage?.createdAt
                  ? theme.selectedItemBackgroundColor
                  : undefined,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRightWidth: 4,
                borderColor:
                  item.receiverId === accountId
                    ? !item.didRead
                      ? theme.linkTextColor
                      : theme.secondaryTextColor
                    : "transparent",
              }}
            >
              <Text
                style={{
                  ...theme.textStyle,
                  fontWeight: "bold",
                  paddingLeft: 16,
                }}
              >
                {item.senderId === accountId
                  ? account?.name ?? ""
                  : item.senderId === contactId
                  ? contact?.name ?? ""
                  : ""}
              </Text>
              <View style={{ flexGrow: 1 }} />
              <Text style={theme.secondaryTextStyle}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <FontAwesome
                name="check"
                size={16}
                color={
                  item.didRead ? theme.linkTextColor : theme.secondaryTextColor
                }
                style={{ marginLeft: 8, paddingRight: 4 }}
              />
            </View>
            <Text style={{ ...theme.textStyle, paddingHorizontal: 16 }}>
              {item.content}
            </Text>
          </Pressable>
        )}
        style={{ flex: 1, marginVertical: 8 }}
        contentContainerStyle={{ flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
      <MessageCompose
        toModifyContent={toModifyMessage?.content}
        onSend={async (text) => {
          await send({
            createdAt: toModifyMessage?.createdAt ?? Date.now(),
            senderId: accountId,
            receiverId: contactId,
            content: text,
          });
          if (toModifyMessage) {
            setToModifyMessage(undefined);
          }
        }}
      />
    </Fragment>
  );
}
