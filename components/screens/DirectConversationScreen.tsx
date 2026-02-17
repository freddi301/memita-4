import { Fragment, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import {
  refreshMemitaQueries,
  useMemitaMutation,
  useMemitaQuery,
} from "../persistance/dataApi";
import { accountLatest } from "../queries/accounts";
import { contactLatest } from "../queries/contacts";
import {
  directMessagesList,
  updateDirectMessage,
} from "../queries/directMessages";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { ContactScreen } from "./ContactScreen";
import { DirectMessagesScreen } from "./DirectMessagesScreen";

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

  return (
    <Fragment>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ScreenLink
          to={<DirectMessagesScreen accountId={accountId} />}
          icon="arrow-left"
          hideLabel
          label={translate({
            en: "Create new contact",
            it: "Crea nuovo contatto",
          })}
        />
        {/* <Text style={{ ...theme.textStyle, flexGrow: 1 }}>
          {contact?.name ?? ""}
        </Text> */}
        <ScreenLink
          to={<ContactScreen accountId={accountId} contactId={contactId} />}
          icon="user"
          label={contact?.name ?? ""}
          flexGrow1
        />
      </View>
      <FlatList
        data={conversation}
        renderItem={({ item }) => (
          <View>
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 16,
                justifyContent: "space-between",
              }}
            >
              <Text style={{ ...theme.textStyle, fontWeight: "bold" }}>
                {item.senderId === accountId
                  ? account?.name ?? ""
                  : item.senderId === contactId
                  ? contact?.name ?? ""
                  : ""}
              </Text>
              <Text style={theme.secondaryTextStyle}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text style={{ ...theme.textStyle, paddingHorizontal: 16 }}>
              {item.content}
            </Text>
          </View>
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
      <MessageCompose accountId={accountId} contactId={contactId} />
    </Fragment>
  );
}

function MessageCompose({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId: string;
}) {
  const theme = useTheme();
  const { translate } = useTranslate();

  const [text, setText] = useState("");

  const send = useMemitaMutation(updateDirectMessage);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        borderTopWidth: 1,
        borderColor: theme.separatorColor,
        paddingLeft: 16,
      }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        style={{
          ...theme.textInputStyle,
          flex: 1,
          paddingVertical: 8,
        }}
      />
      <ScreenLink
        to={async () => {
          await send({
            createdAt: Date.now(),
            senderId: accountId,
            receiverId: contactId,
            content: text,
          });
          setText("");
        }}
        icon="send"
        hideLabel
        label={translate({
          en: "Send message",
          it: "Invia messaggio",
        })}
      />
    </View>
  );
}
