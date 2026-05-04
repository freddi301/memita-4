import { useLingui } from "@lingui/react/macro";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import { AccountId, accountIdFromString } from "../cryptography/cryptography";
import { contactLatest, updateContact } from "../queries/contacts";
import { ScreenLink } from "../Routing";
import {
  useMemitaMutation,
  useMemitaQuery,
  useRefreshMemitaQueries,
} from "../store/dataApi";
import { useTheme } from "../Theme";
import { CryptoAvatar } from "../ui/CryptoAvatar";
import { DirectConversationScreen } from "./DirectConversationScreen";
import { DirectMessagesScreen } from "./DirectMessagesScreen";
import { ProfileScreen } from "./ProfileScreen";

export function ContactScreen({
  accountId,
  contactId,
}: {
  accountId: AccountId;
  contactId?: AccountId;
}) {
  const { t } = useLingui();
  const theme = useTheme();
  const refreshMemitaQueries = useRefreshMemitaQueries();

  const latest = useMemitaQuery(contactLatest, { accountId, contactId }) ?? {
    name: "",
  };

  const update = useMemitaMutation(updateContact);

  const [contactIdInput, setContactIdInput] = useState("");
  const validContactIdInput = useMemo(
    () => accountIdFromString(contactIdInput),
    [contactIdInput],
  );
  const [nameInput, setNameInput] = useState("");
  const nameOriginal = latest.name;
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = validContactIdInput && nameInput !== nameOriginal;

  return (
    <Fragment>
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
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
          label={t`Delete contact`}
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
          label={t`Discard changes`}
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
                      contactId: validContactIdInput,
                      name: nameInput,
                      deleted: false,
                    });
                    return (
                      <ProfileScreen
                        accountId={accountId}
                        contactId={validContactIdInput}
                      />
                    );
                  }
                }
              : undefined
          }
          icon="save"
          hideLabel
          label={contactId ? t`Save changes` : t`Create contact`}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshMemitaQueries} />
        }
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <CryptoAvatar
            accountId={
              contactId ?? validContactIdInput ?? (contactIdInput as AccountId)
            }
          />
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>{t`Contact account id`}</Text>
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
              {!validContactIdInput ? (
                <Text style={theme.validationErrorTextStyle}>
                  {t`Not a valid account id`}
                </Text>
              ) : null}
            </Fragment>
          )}
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>{t`Contact name`}</Text>
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
        label={t`Direct messages`}
      />
      <ScreenLink
        to={
          !canSave && contactId ? (
            <ProfileScreen accountId={accountId} contactId={contactId} />
          ) : undefined
        }
        label={t`Profile`}
      />
    </Fragment>
  );
}
