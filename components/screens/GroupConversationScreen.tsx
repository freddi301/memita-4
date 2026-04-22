import { Fragment, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { AccountId } from "../cryptography/cryptography";
import { groupMessagesList, updateGroupMessage } from "../queries/groupMessages";
import { groupLatest } from "../queries/groups";
import { nowTimestamp, Timestamp } from "../queries/Timestamp";
import { ScreenLink } from "../Routing";
import { refreshMemitaQueries, useMemitaMutation, useMemitaQuery } from "../store/dataApi";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { MessageCompose } from "../ui/MessageCompose";
import { GroupMessagesScreen } from "./GroupMessagesScreen";
import { GroupScreen } from "./GroupScreen";

export function GroupConversationScreen({ accountId, groupId }: { accountId: AccountId; groupId: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const group = useMemitaQuery(groupLatest, { accountId, groupId });
  const conversation = useMemitaQuery(groupMessagesList, {
    accountId,
    groupId,
  });

  const send = useMemitaMutation(updateGroupMessage);

  const [toModifyMessage, setToModifyMessage] = useState<
    | undefined
    | {
        createdAt: Timestamp;
        content: string;
      }
  >();

  return (
    <Fragment>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ScreenLink
          to={<GroupMessagesScreen accountId={accountId} />}
          icon="arrow-left"
          hideLabel
          label={translate({
            en: "Go to messages",
            it: "Vai ai messaggi",
          })}
        />
        <ScreenLink
          to={<GroupScreen accountId={accountId} groupId={groupId} />}
          icon="user"
          label={group?.name ?? ""}
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
              setToModifyMessage(
                item.createdAt === toModifyMessage?.createdAt && item.senderId === accountId
                  ? undefined
                  : {
                      createdAt: item.createdAt,
                      content: item.content,
                    },
              );
            }}
            style={{
              backgroundColor:
                item.createdAt === toModifyMessage?.createdAt ? theme.selectedItemBackgroundColor : undefined,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 16,
                justifyContent: "space-between",
              }}
            >
              <Text style={{ ...theme.textStyle, fontWeight: "bold" }}>{item.senderName}</Text>
              <Text style={theme.secondaryTextStyle}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            <Text style={{ ...theme.textStyle, paddingHorizontal: 16 }}>{item.content}</Text>
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
            createdAt: toModifyMessage?.createdAt ?? nowTimestamp(),
            senderId: accountId,
            groupId: groupId,
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
