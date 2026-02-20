import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import {
  refreshMemitaQueries,
  useMemitaMutation,
  useMemitaQuery,
} from "../persistance/dataApi";
import { biographyLatest, updateBiography } from "../queries/biography";
import { contactLatest } from "../queries/contacts";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { AccountScreen } from "./AccountScreen";
import { ContactScreen } from "./ContactScreen";
import { DirectConversationScreen } from "./DirectConversationScreen";

export function ProfileScreen({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId: string;
}) {
  const theme = useTheme();
  const { translate } = useTranslate();

  const contact = useMemitaQuery(contactLatest, {
    accountId,
    contactId,
  })[0] ?? { name: "" };

  const biography = useMemitaQuery(biographyLatest, {
    accountId: contactId,
  })[0] ?? { content: "" };

  const update = useMemitaMutation(updateBiography);

  const [bioInput, setBioInput] = useState("");
  const bioOriginal = biography.content;
  useEffect(() => {
    setBioInput(bioOriginal);
  }, [bioOriginal]);

  const canSave = bioInput !== bioOriginal;

  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <Text
          style={{
            ...theme.textStyle,
            fontWeight: "bold",
            paddingLeft: 16,
            flexGrow: 1,
          }}
        >
          {contact.name}
        </Text>
        {contactId === accountId && (
          <Fragment>
            <ScreenLink
              to={
                canSave
                  ? async () => {
                      setBioInput(bioOriginal);
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
                      await update({
                        accountId,
                        content: bioInput,
                      });
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
          </Fragment>
        )}
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshMemitaQueries} />
        }
      >
        {contactId === accountId ? (
          <Fragment>
            <TextInput
              value={bioInput}
              onChangeText={setBioInput}
              style={{
                ...theme.textInputStyle,
                marginHorizontal: 16,
                maxHeight: "100%",
              }}
              multiline
            />
          </Fragment>
        ) : (
          <Text
            style={{
              ...theme.textStyle,
              paddingHorizontal: 16,
            }}
          >
            {biography.content}
          </Text>
        )}
      </ScrollView>
      <ScreenLink
        to={
          <DirectConversationScreen
            accountId={accountId}
            contactId={contactId}
          />
        }
        label={translate({ en: "Direct messages", it: "Mesaggi diretti" })}
      />
      {accountId === contactId ? (
        <ScreenLink
          to={<AccountScreen accountId={accountId} />}
          label={translate({
            en: "Account settings",
            it: "Impostazioni account",
          })}
        />
      ) : (
        <ScreenLink
          to={<ContactScreen accountId={accountId} contactId={contactId} />}
          label={translate({ en: "Edit contact", it: "Modifica contatto" })}
        />
      )}
      {contactId === accountId ? (
        <BottomTabNavigation accountId={accountId} enabled={true} />
      ) : null}
    </Fragment>
  );
}
