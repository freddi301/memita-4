import { FontAwesome } from "@expo/vector-icons";
import { Fragment, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
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
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { MessageCompose } from "../ui/MessageCompose";
import { DirectMessagesScreen } from "./DirectMessagesScreen";
import { ProfileScreen } from "./ProfileScreen";

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
      }
  >();

  useMemitaSubscription();

  const flatListRef = useRef<FlatList<(typeof conversation)[number]>>(null);

  const [searchState, setSearchState] = useState({
    active: false,
    text: "",
    currentIndex: 0,
  });

  const [didReadState, setDidReadState] = useState({
    currentIndex: 0,
  });

  return (
    <Fragment>
      {!searchState.active && (
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
          <ScreenLink
            to={async () => {
              setSearchState((state) => ({ ...state, active: true }));
            }}
            icon="search"
            hideLabel
            label={translate({
              en: "Search",
              it: "Cerca",
            })}
          />
        </View>
      )}
      {searchState.active && (
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <ScreenLink
            to={async () =>
              setSearchState({ active: false, text: "", currentIndex: 0 })
            }
            icon="close"
            hideLabel
            label={translate({
              en: "Stop searching",
              it: "Interrompi ricerca",
            })}
          />
          <TextInput
            style={{ ...theme.textInputStyle, paddingBottom: 5, flexGrow: 1 }}
            value={searchState.text}
            onChangeText={(text) =>
              setSearchState((state) => ({ ...state, text }))
            }
          />
          <ScreenLink
            to={(() => {
              const previous = conversation.findLastIndex(
                (item, i) =>
                  i < searchState.currentIndex &&
                  item.content
                    .toLowerCase()
                    .includes(searchState.text.toLowerCase()),
              );
              if (previous >= 0 && searchState.text.length > 0) {
                return async () => {
                  setSearchState((state) => ({
                    ...state,
                    currentIndex: previous,
                  }));
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
                  i > searchState.currentIndex &&
                  item.content
                    .toLowerCase()
                    .includes(searchState.text.toLowerCase()),
              );
              if (next >= 0 && searchState.text.length > 0) {
                return async () => {
                  setSearchState((state) => ({
                    ...state,
                    currentIndex: next,
                  }));
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
      )}
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
          const isCurrentOccurrence =
            searchState.active &&
            searchState.text.length > 0 &&
            searchState.currentIndex === index;
          const isCurrentDidReadOccurrence =
            didReadState.currentIndex === index &&
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
                        },
                  );
                }
              }}
              style={{
                flexDirection: "row",
                backgroundColor:
                  item.createdAt === toModifyMessage?.createdAt
                    ? theme.selectedItemBackgroundColor
                    : undefined,
              }}
            >
              {isCurrentOccurrence && (
                <View
                  style={{
                    backgroundColor: "lightgreen",
                    height: "100%",
                    width: 8,
                  }}
                />
              )}
              {isCurrentDidReadOccurrence && (
                <View
                  style={{
                    backgroundColor: theme.linkTextColor,
                    height: "100%",
                    width: 8,
                  }}
                />
              )}
              <View style={{ flexGrow: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRightWidth: 4,
                    borderColor:
                      item.receiverId === accountId && !item.didRead
                        ? "orange"
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
                    name="check"
                    size={16}
                    color={
                      item.didRead ? theme.linkTextColor : theme.backgroundColor
                    }
                    style={{
                      marginLeft: 8,
                      paddingRight: 4,
                    }}
                  />
                </View>
                <Text style={{ ...theme.textStyle, paddingHorizontal: 16 }}>
                  {searchState.active
                    ? item.content
                        .split(new RegExp(`(${searchState.text})`, "i"))
                        .map((part, index) => {
                          const isMatch =
                            part.toLowerCase() ===
                            searchState.text.toLowerCase();
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
              </View>
            </Pressable>
          );
        }}
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
      />
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <ScreenLink
          to={(() => {
            const previous = conversation.findLastIndex(
              (item, i) =>
                i < didReadState.currentIndex &&
                item.didRead === false &&
                item.receiverId === accountId,
            );
            if (previous >= 0) {
              return async () => {
                setDidReadState((state) => ({
                  ...state,
                  currentIndex: previous,
                }));
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
            const current = conversation[didReadState.currentIndex];
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
                    i > didReadState.currentIndex &&
                    item.didRead === false &&
                    item.receiverId === accountId,
                );
                if (next >= 0) {
                  setDidReadState((state) => ({
                    ...state,
                    currentIndex: next,
                  }));
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
                i > didReadState.currentIndex &&
                item.didRead === false &&
                item.receiverId === accountId,
            );
            if (next >= 0) {
              return async () => {
                setDidReadState((state) => ({
                  ...state,
                  currentIndex: next,
                }));
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
      <MessageCompose
        toModify={toModifyMessage}
        onUpdate={async ({ content, isDraft }) => {
          if (!toModifyMessage && isDraft) {
            // create draft
            const createdAt = nowTimestamp();
            await update({
              createdAt: createdAt,
              senderId: accountId,
              receiverId: contactId,
              isDraft: true,
              content,
            });
            setToModifyMessage({
              createdAt,
              isDraft: true,
              content,
            });
          } else if (toModifyMessage && toModifyMessage.isDraft && isDraft) {
            // update draft
            await update({
              createdAt: toModifyMessage.createdAt,
              senderId: accountId,
              receiverId: contactId,
              isDraft: true,
              content,
            });
            setToModifyMessage({
              createdAt: toModifyMessage.createdAt,
              isDraft: true,
              content,
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
            });
            await update({
              createdAt: toModifyMessage.createdAt,
              senderId: accountId,
              receiverId: contactId,
              isDraft: true,
              content: "",
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
