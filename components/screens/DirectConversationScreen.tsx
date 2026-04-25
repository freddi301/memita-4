import { FontAwesome } from "@expo/vector-icons";
import { Fragment, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { AccountId } from "../cryptography/cryptography";
import { accountLatest } from "../queries/accounts";
import { contactLatest } from "../queries/contacts";
import {
  directMessagesList,
  updateDidReadDirectMessage,
  updateDirectMessage,
} from "../queries/directMessages";
import { nowTimestamp, Timestamp } from "../queries/Timestamp";
import { ScreenLink } from "../Routing";
import {
  useMemitaMutation,
  useMemitaQuery,
  useMemitaSubscription,
} from "../store/dataApi";
import { ContentAddress } from "../store/fileStore";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { AttachmentPreview } from "../ui/AttachmentPreview";
import { MessageCompose } from "../ui/MessageCompose";
import { DirectMessagesScreen } from "./DirectMessagesScreen";
import { ProfileScreen } from "./ProfileScreen";

// TODO profile with lot of messages how search and did red navigation performs

export function DirectConversationScreen({
  accountId,
  contactId,
}: {
  accountId: AccountId;
  contactId: AccountId;
}) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const account = useMemitaQuery(accountLatest, { accountId });
  const contact = useMemitaQuery(contactLatest, { accountId, contactId });
  const conversation = useMemitaQuery(directMessagesList, {
    accountId,
    contactId,
  });

  const update = useMemitaMutation(updateDirectMessage);

  const didRead = useMemitaMutation(updateDidReadDirectMessage);

  const [toModifyMessage, setToModifyMessage] = useState<
    | undefined
    | {
        createdAt: Timestamp;
        isDraft: boolean;
        content: string;
        attachments: Array<{ name: string; hash: ContentAddress }>;
      }
  >();

  useMemitaSubscription();

  const flatListRef = useRef<FlatList<(typeof conversation)[number]>>(null);

  const [toolbarState, setToolbarState] = useState<
    | { type: "search"; text: string; currentIndex: number }
    | { type: "didRead"; currentIndex: number }
  >({
    type: "didRead",
    currentIndex: conversation.findIndex(
      (item) => item.receiverId === accountId && !item.didRead,
    ),
  });

  return (
    <Fragment>
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderColor: theme.separatorColor,
        }}
      >
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
        ref={flatListRef}
        data={conversation}
        getItemLayout={(data, index) => {
          // this is needed for scrollToIndex to work properly
          // for now this magic number works
          return {
            length: 36,
            offset: index * (36 + 8),
            index,
          };
        }}
        renderItem={({ item, index }) => {
          const isCurrentSearchOccurrence =
            toolbarState.type === "search" &&
            toolbarState.text.length > 0 &&
            toolbarState.currentIndex === index;
          const isCurrentDidReadOccurrence =
            toolbarState.type === "didRead" &&
            toolbarState.currentIndex === index &&
            item.receiverId === accountId &&
            !item.didRead;
          return (
            <Pressable
              onLongPress={() => {
                if (item.senderId === accountId) {
                  setToModifyMessage(
                    item.createdAt === toModifyMessage?.createdAt
                      ? undefined
                      : {
                          createdAt: item.createdAt,
                          isDraft: item.isDraft,
                          content: item.content,
                          attachments: item.attachments,
                        },
                  );
                }
              }}
              style={{
                backgroundColor:
                  item.createdAt === toModifyMessage?.createdAt
                    ? theme.selectedItemBackgroundColor
                    : theme.backgroundColor,
                borderRadius: 8,
                paddingHorizontal: 7,
                paddingVertical: 5,
                marginVertical: 3,
                overflow: "hidden",
                borderWidth: 2,
                // TODO add search and didRead color to theme colors
                borderColor: isCurrentSearchOccurrence
                  ? "lightgreen"
                  : isCurrentDidReadOccurrence
                    ? theme.linkTextColor
                    : theme.backgroundBackColor,
              }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Text style={{ ...theme.textStyle, fontWeight: "bold" }}>
                  {item.senderId === accountId
                    ? (account?.name ?? "")
                    : item.senderId === contactId
                      ? (contact?.name ?? "")
                      : ""}
                </Text>
                <View style={{ flexGrow: 1 }} />
                <Text style={theme.secondaryTextStyle}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
                <FontAwesome
                  name={item.isDraft ? "sticky-note" : "check"}
                  size={14}
                  color={
                    item.isDraft
                      ? theme.secondaryTextColor
                      : item.didRead
                        ? theme.linkTextColor
                        : item.receiverId === accountId && !item.didRead
                          ? "orange"
                          : theme.backgroundColor
                  }
                />
              </View>
              <Text style={{ ...theme.textStyle }}>
                {toolbarState.type === "search"
                  ? item.content
                      .split(new RegExp(`(${toolbarState.text})`, "i"))
                      .map((part, index) => {
                        const isMatch =
                          part.toLowerCase() ===
                          toolbarState.text.toLowerCase();
                        return (
                          <Text
                            key={index}
                            style={{
                              backgroundColor: isMatch
                                ? "lightgreen"
                                : undefined,
                              color: isMatch ? "black" : undefined,
                              fontWeight: isMatch ? "bold" : undefined,
                            }}
                          >
                            {part}
                          </Text>
                        );
                      })
                  : item.content}
              </Text>
              {item.attachments.length > 0 && (
                <ScrollView
                  horizontal
                  style={{
                    marginHorizontal: -7,
                    marginBottom: -5,
                    marginTop: 8,
                  }}
                >
                  {item.attachments.map((file, index) => (
                    <AttachmentPreview key={index} file={file} />
                  ))}
                </ScrollView>
              )}
            </Pressable>
          );
        }}
        style={{ flex: 1, backgroundColor: theme.backgroundBackColor }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: 5,
          paddingHorizontal: 7,
        }}
        ListEmptyComponent={() => (
          <Text
            style={{
              ...theme.secondaryTextStyle,
              textAlign: "center",
              margin: 16,
            }}
          >
            {translate({
              en: "No messages",
              it: "Nessun messagio",
            })}
          </Text>
        )}
      />
      {(() => {
        if (toModifyMessage) {
          return null;
        }
        switch (toolbarState.type) {
          case "didRead": {
            return (
              <View
                style={{
                  flexDirection: "row",
                  borderTopWidth: 1,
                  borderColor: theme.separatorColor,
                }}
              >
                <ScreenLink
                  to={async () => {
                    setToolbarState({
                      type: "search",
                      text: "",
                      currentIndex: 0,
                    });
                  }}
                  icon="eye"
                  hideLabel
                  label={translate({
                    en: "Search",
                    it: "Cerca",
                  })}
                />
                <View style={{ flexGrow: 1 }} />
                <ScreenLink
                  to={(() => {
                    const previous = conversation.findLastIndex(
                      (item, i) =>
                        i < toolbarState.currentIndex &&
                        item.didRead === false &&
                        item.receiverId === accountId,
                    );
                    if (previous >= 0) {
                      return async () => {
                        setToolbarState({
                          type: "didRead",
                          currentIndex: previous,
                        });
                        flatListRef.current?.scrollToIndex({
                          index: previous,
                        });
                      };
                    }
                  })()}
                  icon="arrow-up"
                  hideLabel
                  label={translate({
                    en: "Previous occurrence",
                    it: "Occorrenza precedente",
                  })}
                />
                <ScreenLink
                  to={(() => {
                    const current = conversation[toolbarState.currentIndex];
                    if (
                      current &&
                      !current.didRead &&
                      current.receiverId === accountId
                    ) {
                      return async () => {
                        await didRead({
                          senderId: current.senderId,
                          receiverId: current.receiverId,
                          createdAt: current.createdAt,
                          didRead: true,
                        });
                        const next = conversation.findIndex(
                          (item, i) =>
                            i > toolbarState.currentIndex &&
                            item.didRead === false &&
                            item.receiverId === accountId,
                        );
                        if (next >= 0) {
                          setToolbarState({
                            type: "didRead",
                            currentIndex: next,
                          });
                          flatListRef.current?.scrollToIndex({
                            index: next,
                          });
                        }
                      };
                    }
                  })()}
                  icon="check"
                  hideLabel
                  label={translate({
                    en: "Mark as read",
                    it: "Segna come letto",
                  })}
                />
                <ScreenLink
                  to={(() => {
                    const next = conversation.findIndex(
                      (item, i) =>
                        i > toolbarState.currentIndex &&
                        item.didRead === false &&
                        item.receiverId === accountId,
                    );
                    if (next >= 0) {
                      return async () => {
                        setToolbarState({
                          type: "didRead",
                          currentIndex: next,
                        });
                        flatListRef.current?.scrollToIndex({
                          index: next,
                        });
                      };
                    }
                  })()}
                  icon="arrow-down"
                  hideLabel
                  label={translate({
                    en: "Next occurrence",
                    it: "Occorrenza successiva",
                  })}
                />
              </View>
            );
          }
          case "search": {
            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  borderTopWidth: 1,
                  borderColor: theme.separatorColor,
                }}
              >
                <ScreenLink
                  to={async () => {
                    setToolbarState({ type: "didRead", currentIndex: 0 });
                  }}
                  icon="search"
                  hideLabel
                  label={translate({
                    en: "Unread messages",
                    it: "Messaggi non letti",
                  })}
                />
                <TextInput
                  style={{
                    ...theme.textInputStyle,
                    paddingBottom: 5,
                    flexGrow: 1,
                  }}
                  value={toolbarState.text}
                  onChangeText={(text) =>
                    setToolbarState({
                      type: "search",
                      text,
                      currentIndex: toolbarState.currentIndex,
                    })
                  }
                />
                <ScreenLink
                  to={(() => {
                    const previous = conversation.findLastIndex(
                      (item, i) =>
                        i < toolbarState.currentIndex &&
                        item.content
                          .toLowerCase()
                          .includes(toolbarState.text.toLowerCase()),
                    );
                    if (previous >= 0 && toolbarState.text.length > 0) {
                      return async () => {
                        setToolbarState({
                          type: "search",
                          text: toolbarState.text,
                          currentIndex: previous,
                        });
                        flatListRef.current?.scrollToIndex({
                          index: previous,
                        });
                      };
                    }
                  })()}
                  icon="arrow-up"
                  hideLabel
                  label={translate({
                    en: "Previous occurrence",
                    it: "Occorrenza precedente",
                  })}
                />
                <ScreenLink
                  to={(() => {
                    const next = conversation.findIndex(
                      (item, i) =>
                        i > toolbarState.currentIndex &&
                        item.content
                          .toLowerCase()
                          .includes(toolbarState.text.toLowerCase()),
                    );
                    if (next >= 0 && toolbarState.text.length > 0) {
                      return async () => {
                        setToolbarState({
                          type: "search",
                          text: toolbarState.text,
                          currentIndex: next,
                        });
                        flatListRef.current?.scrollToIndex({
                          index: next,
                        });
                      };
                    }
                  })()}
                  icon="arrow-down"
                  hideLabel
                  label={translate({
                    en: "Next occurrence",
                    it: "Occorrenza successiva",
                  })}
                />
              </View>
            );
          }
        }
      })()}
      <MessageCompose
        toModify={toModifyMessage}
        onUpdate={async ({ content, attachments, isDraft }) => {
          if (!toModifyMessage && isDraft) {
            // create draft
            const createdAt = nowTimestamp();
            await update({
              createdAt: createdAt,
              senderId: accountId,
              receiverId: contactId,
              isDraft: true,
              content,
              attachments,
            });
            setToModifyMessage({
              createdAt,
              isDraft: true,
              content,
              attachments,
            });
          } else if (toModifyMessage && toModifyMessage.isDraft && isDraft) {
            // update draft
            await update({
              createdAt: toModifyMessage.createdAt,
              senderId: accountId,
              receiverId: contactId,
              isDraft: true,
              content,
              attachments,
            });
            setToModifyMessage({
              createdAt: toModifyMessage.createdAt,
              isDraft: true,
              content,
              attachments,
            });
          } else if (toModifyMessage && toModifyMessage.isDraft && !isDraft) {
            // publish draft
            const createdAt = nowTimestamp();
            await update({
              createdAt: createdAt,
              senderId: accountId,
              receiverId: contactId,
              isDraft: false,
              content,
              attachments,
            });
            await update({
              createdAt: toModifyMessage.createdAt,
              senderId: accountId,
              receiverId: contactId,
              isDraft: true,
              content: "",
              attachments: [],
            });
            setToModifyMessage(undefined);
          } else if (toModifyMessage && !toModifyMessage.isDraft && !isDraft) {
            // update message
            await update({
              createdAt: toModifyMessage.createdAt,
              senderId: accountId,
              receiverId: contactId,
              isDraft: false,
              content,
              attachments,
            });
            setToModifyMessage(undefined);
          } else {
            throw new Error("Invalid state");
          }
        }}
      />
    </Fragment>
  );
}
