import { FontAwesome } from "@expo/vector-icons";
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  ViewToken,
} from "react-native";
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
import { useMemitaMutation, useMemitaQuery } from "../store/dataApi";
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

  const [toolbarState, setToolbarState] = useState<
    { type: "search"; text: string } | { type: "didRead" }
  >({
    type: "didRead",
  });

  const [currentViewingMessageId, setCurrentViewingMessageId] = useState<
    | { senderId: AccountId; receiverId: AccountId; createdAt: Timestamp }
    | undefined
  >(conversation.at(-1));
  const currentViewingMessageIndex = conversation.findIndex(
    (item) =>
      item.createdAt === currentViewingMessageId?.createdAt &&
      item.senderId === currentViewingMessageId?.senderId &&
      item.receiverId === currentViewingMessageId?.receiverId,
  );

  const flatListRef = useRef<FlatList<(typeof conversation)[number]>>(null);

  const [flatListHeight, setFlatListHeight] = useState(0);

  const itemVerticalMarginHalf = 3;
  const itemVerticalPaddingHalf = 5;
  const itemVerticalBorderWidth = 2;
  const itemAttachementHeight = 100;
  const getItemHeight = (item: (typeof conversation)[number]) => {
    return (
      itemVerticalMarginHalf * 2 +
      itemVerticalPaddingHalf * 2 +
      itemVerticalBorderWidth * 2 +
      +theme.textStyle.lineHeight + // contact name
      theme.textStyle.lineHeight * item.content.split("\n").length +
      (item.attachments.length > 0 ? itemAttachementHeight : 0)
    );
  };
  const firstItemHeight = conversation[0] ? getItemHeight(conversation[0]) : 0;
  const initialEmptySpaceHeight =
    flatListHeight - itemVerticalMarginHalf * 2 - firstItemHeight;
  const conversationItemLayouts = conversation.reduce(
    ({ offset, layouts }, item, index) => {
      const length = getItemHeight(item);
      layouts.push({ length, offset, index });
      return { offset: offset + length, layouts };
    },
    {
      offset: initialEmptySpaceHeight,
      layouts: [] as Array<{ length: number; offset: number; index: number }>,
    },
  ).layouts;

  // TODO maybe save permanently current viewing by converstaion on device

  // restore scroll position on mount
  useLayoutEffect(() => {
    flatListRef.current?.scrollToIndex({
      index:
        conversation.findIndex(
          (item) =>
            item.createdAt === currentViewingMessageId?.createdAt &&
            item.senderId === currentViewingMessageId?.senderId &&
            item.receiverId === currentViewingMessageId?.receiverId,
        ) ?? 0,
      animated: false,
      viewPosition: 1.0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        onLayout={(event) => {
          setFlatListHeight(event.nativeEvent.layout.height);
        }}
        getItemLayout={(data, index) => conversationItemLayouts[index]!}
        onViewableItemsChanged={useCallback(
          ({
            viewableItems,
          }: {
            viewableItems: Array<ViewToken<(typeof conversation)[number]>>;
            changed: Array<ViewToken<(typeof conversation)[number]>>;
          }) => {
            const currentItem = viewableItems.at(-1)?.item;
            if (currentItem) {
              setCurrentViewingMessageId({
                senderId: currentItem.senderId,
                receiverId: currentItem.receiverId,
                createdAt: currentItem.createdAt,
              });
            }
          },
          [],
        )}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 100,
        }}
        style={{ flex: 1, backgroundColor: theme.backgroundBackColor }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: initialEmptySpaceHeight,
          paddingBottom: itemVerticalPaddingHalf,
          paddingHorizontal: 7,
        }}
        renderItem={({ item, index }) => {
          const isCurrentViewingMessage =
            currentViewingMessageId &&
            item.createdAt === currentViewingMessageId.createdAt &&
            item.senderId === currentViewingMessageId.senderId &&
            item.receiverId === currentViewingMessageId.receiverId;
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
                paddingVertical: itemVerticalPaddingHalf,
                marginVertical: itemVerticalMarginHalf,
                overflow: "hidden",
                borderWidth: itemVerticalBorderWidth,
                // TODO add search and current viewing message color to theme colors
                borderColor: isCurrentViewingMessage
                  ? "purple"
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
                    setToolbarState({ type: "search", text: "" });
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
                        i < currentViewingMessageIndex &&
                        item.didRead === false &&
                        item.receiverId === accountId,
                    );
                    if (previous >= 0) {
                      return async () => {
                        setToolbarState({
                          type: "didRead",
                        });
                        flatListRef.current?.scrollToIndex({
                          index: previous,
                          viewPosition: 1.0,
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
                    const current = conversation[currentViewingMessageIndex];
                    if (current && current.receiverId === accountId) {
                      return async () => {
                        await didRead({
                          senderId: current.senderId,
                          receiverId: current.receiverId,
                          createdAt: current.createdAt,
                          didRead: !current.didRead,
                        });
                        const next = conversation.findIndex(
                          (item, i) =>
                            i > currentViewingMessageIndex &&
                            item.didRead === false &&
                            item.receiverId === accountId,
                        );
                        if (
                          next >= 0 &&
                          next === currentViewingMessageIndex + 1 &&
                          current.didRead === false
                        ) {
                          setToolbarState({ type: "didRead" });
                          flatListRef.current?.scrollToIndex({
                            index: next,
                            viewPosition: 1.0,
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
                  color={
                    conversation[currentViewingMessageIndex]
                      ? conversation[currentViewingMessageIndex].didRead
                        ? "orange"
                        : theme.linkTextColor
                      : theme.secondaryTextColor
                  }
                />
                <ScreenLink
                  to={(() => {
                    const next = conversation.findIndex(
                      (item, i) =>
                        i > currentViewingMessageIndex &&
                        item.didRead === false &&
                        item.receiverId === accountId,
                    );
                    if (next >= 0) {
                      return async () => {
                        setToolbarState({
                          type: "didRead",
                        });
                        flatListRef.current?.scrollToIndex({
                          index: next,
                          viewPosition: 1.0,
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
                    setToolbarState({ type: "didRead" });
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
                    })
                  }
                />
                <ScreenLink
                  to={(() => {
                    const previous = conversation.findLastIndex(
                      (item, i) =>
                        i < currentViewingMessageIndex &&
                        item.content
                          .toLowerCase()
                          .includes(toolbarState.text.toLowerCase()),
                    );
                    if (previous >= 0 && toolbarState.text.length > 0) {
                      return async () => {
                        setToolbarState({
                          type: "search",
                          text: toolbarState.text,
                        });
                        flatListRef.current?.scrollToIndex({
                          index: previous,
                          viewPosition: 1.0,
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
                        i > currentViewingMessageIndex &&
                        item.content
                          .toLowerCase()
                          .includes(toolbarState.text.toLowerCase()),
                    );
                    if (next >= 0 && toolbarState.text.length > 0) {
                      return async () => {
                        setToolbarState({
                          type: "search",
                          text: toolbarState.text,
                        });
                        flatListRef.current?.scrollToIndex({
                          index: next,
                          viewPosition: 1.0,
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
            await Promise.all([
              update({
                createdAt: createdAt,
                senderId: accountId,
                receiverId: contactId,
                isDraft: false,
                content,
                attachments,
              }),
              update({
                createdAt: toModifyMessage.createdAt,
                senderId: accountId,
                receiverId: contactId,
                isDraft: true,
                content: "",
                attachments: [],
              }),
            ]);
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
