import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import { contactLatest, updateContact } from "../queries/contacts";
import { ScreenLink } from "../Routing";
import {
  refreshMemitaQueries,
  useMemitaMutation,
  useMemitaQuery,
} from "../store/dataApi";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { DirectConversationScreen } from "./DirectConversationScreen";
import { DirectMessagesScreen } from "./DirectMessagesScreen";
import { ProfileScreen } from "./ProfileScreen";

export function ContactScreen({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId?: string;
}) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const latest = useMemitaQuery(contactLatest, {
    accountId,
    contactId: contactId || "",
  }) ?? { name: "" };

  const update = useMemitaMutation(updateContact);

  const [contactIdInput, setContactIdInput] = useState("");
  const isContactIdValid = !contactId ? contactIdInput.length > 5 : true; // TODO

  const [nameInput, setNameInput] = useState("");
  const nameOriginal = latest.name;
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = isContactIdValid && nameInput !== nameOriginal;

  return (
    <Fragment>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <ScreenLink
          to={
            !canSave && contactId !== undefined
              ? async () => {
                  await update({
                    accountId,
                    contactId,
                    name: nameOriginal,
                    deleted: true,
                  });
                  return <DirectMessagesScreen accountId={accountId} />;
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
            canSave && contactId !== undefined
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
                  if (contactId) {
                    await update({
                      accountId,
                      contactId,
                      name: nameInput,
                      deleted: false,
                    });
                  } else {
                    await update({
                      accountId,
                      contactId: contactIdInput,
                      name: nameInput,
                      deleted: false,
                    });
                    return (
                      <ProfileScreen
                        accountId={accountId}
                        contactId={contactIdInput}
                      />
                    );
                  }
                }
              : undefined
          }
          icon="save"
          hideLabel
          label={
            contactId
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
              en: "Contact account id",
              it: "Id dell'account del contatto",
            })}
          </Text>
          {contactId ? (
            <Text style={theme.textStyle}>{contactId}</Text>
          ) : (
            <Fragment>
              <TextInput
                value={contactIdInput}
                onChangeText={setContactIdInput}
                style={theme.textInputStyle}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!isContactIdValid ? (
                <Text style={theme.validationErrorTextStyle}>
                  {translate({
                    en: "Not a valid account id",
                    it: "Non è un id account valido",
                  })}
                </Text>
              ) : null}
            </Fragment>
          )}
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>
            {translate({
              en: "Contact name",
              it: "Nome del contatto",
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
      <ScreenLink
        to={
          !canSave && contactId ? (
            <DirectConversationScreen
              accountId={accountId}
              contactId={contactId}
            />
          ) : undefined
        }
        label={translate({
          en: "Direct messages",
          it: "Messaggi diretti",
        })}
      />
      <ScreenLink
        to={
          !canSave && contactId ? (
            <ProfileScreen accountId={accountId} contactId={contactId} />
          ) : undefined
        }
        label={translate({
          en: "Profile",
          it: "Profilo",
        })}
      />
    </Fragment>
  );
}
