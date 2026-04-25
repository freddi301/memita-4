import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import { AccountId } from "../cryptography/cryptography";
import { groupLatest, updateGroup } from "../queries/groups";
import { ScreenLink } from "../Routing";
import {
  refreshMemitaQueries,
  useMemitaMutation,
  useMemitaQuery,
} from "../store/dataApi";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { GroupConversationScreen } from "./GroupConversationScreen";
import { GroupMessagesScreen } from "./GroupMessagesScreen";

export function GroupScreen({
  accountId,
  groupId,
}: {
  accountId: AccountId;
  groupId?: string; // TODO use branded type
}) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const latest = useMemitaQuery(groupLatest, {
    accountId,
    groupId: groupId || "",
  }) ?? { name: "" };

  const update = useMemitaMutation(updateGroup);

  const [groupIdInput, setContactIdInput] = useState("");
  const isGroupIdValid = !groupId ? groupIdInput.length > 5 : true; // TODO

  const [nameInput, setNameInput] = useState("");
  const nameOriginal = latest.name;
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = isGroupIdValid && nameInput !== nameOriginal;

  return (
    <Fragment>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <ScreenLink
          to={
            !canSave && groupId ? (
              <GroupConversationScreen
                accountId={accountId}
                groupId={groupId}
              />
            ) : undefined
          }
          icon="arrow-left"
          hideLabel
          label={translate({
            en: "Go to conversation",
            it: "Vai alla conversazione",
          })}
        />
        <View style={{ flexDirection: "row" }}>
          <ScreenLink
            to={
              !canSave && groupId !== undefined
                ? async () => {
                    await update({
                      accountId,
                      groupId,
                      name: nameOriginal,
                      deleted: true,
                    });
                    return <GroupMessagesScreen accountId={accountId} />;
                  }
                : undefined
            }
            icon="trash"
            hideLabel
            label={translate({
              en: "Delete contact",
              it: "Elimina contatto",
            })}
          />
          <ScreenLink
            to={
              canSave && groupId !== undefined
                ? async () => {
                    setNameInput(nameOriginal);
                  }
                : undefined
            }
            icon="undo"
            hideLabel
            label={translate({
              en: "Discard changes",
              it: "Scarta modifiche",
            })}
          />
          <ScreenLink
            to={
              canSave
                ? async () => {
                    if (groupId) {
                      await update({
                        accountId,
                        groupId,
                        name: nameInput,
                        deleted: false,
                      });
                    } else {
                      await update({
                        accountId,
                        groupId: groupIdInput,
                        name: nameInput,
                        deleted: false,
                      });
                      return (
                        <GroupScreen
                          accountId={accountId}
                          groupId={groupIdInput}
                        />
                      );
                    }
                  }
                : undefined
            }
            icon="save"
            hideLabel
            label={
              groupId
                ? translate({
                    en: "Save changes",
                    it: "Salva modifiche",
                  })
                : translate({
                    en: "Create contact",
                    it: "Crea contatto",
                  })
            }
          />
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshMemitaQueries} />
        }
      >
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>
            {translate({
              en: "Group id",
              it: "Id del gruppo",
            })}
          </Text>
          {groupId ? (
            <Text style={theme.textStyle}>{groupId}</Text>
          ) : (
            <Fragment>
              <TextInput
                value={groupIdInput}
                onChangeText={setContactIdInput}
                style={theme.textInputStyle}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!isGroupIdValid ? (
                <Text style={theme.validationErrorTextStyle}>
                  {translate({
                    en: "Not a valid group id",
                    it: "Non è un id gruppo valido",
                  })}
                </Text>
              ) : null}
            </Fragment>
          )}
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>
            {translate({
              en: "Group name",
              it: "Nome del gruppo",
            })}
          </Text>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            style={theme.textInputStyle}
          />
          {nameInput !== nameOriginal ? (
            <Text
              style={{
                ...theme.secondaryTextStyle,
                textDecorationLine: "line-through",
              }}
            >
              {nameOriginal || " "}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </Fragment>
  );
}
