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
import { CoordsInput } from "../ui/CoordsInput";
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
  })[0] ?? { content: "", location: undefined };

  const update = useMemitaMutation(updateBiography);

  const bioOriginal = biography.content;
  const [bioInput, setBioInput] = useState(bioOriginal);
  useEffect(() => {
    setBioInput(bioOriginal);
  }, [bioOriginal]);

  const locationOriginal = biography.location;
  const [locationInput, setLocationInput] = useState(locationOriginal);
  useEffect(() => {
    setLocationInput(locationOriginal);
  }, [locationOriginal]);

  const canSave =
    bioInput !== bioOriginal || locationInput !== locationOriginal;

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
                      setLocationInput(locationOriginal);
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
                        location: locationInput,
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
        <View style={{ gap: 2, paddingVertical: 8 }}>
          <Text style={{ ...theme.secondaryTextStyle, paddingHorizontal: 16 }}>
            {translate({
              en: "Location",
              it: "Posizione",
            })}
          </Text>
          <CoordsInput value={locationInput} onChange={setLocationInput} />
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>
            {translate({
              en: "Biography",
              it: "Biografia",
            })}
          </Text>
          {contactId === accountId ? (
            <TextInput
              value={bioInput}
              onChangeText={setBioInput}
              style={{
                ...theme.textInputStyle,
                maxHeight: "100%",
              }}
              multiline
            />
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
        </View>
      </ScrollView>
      <ScreenLink
        to={
          canSave ? undefined : (
            <DirectConversationScreen
              accountId={accountId}
              contactId={contactId}
            />
          )
        }
        label={translate({ en: "Direct messages", it: "Mesaggi diretti" })}
      />
      {accountId === contactId ? (
        <ScreenLink
          to={canSave ? undefined : <AccountScreen accountId={accountId} />}
          label={translate({
            en: "Account settings",
            it: "Impostazioni account",
          })}
        />
      ) : (
        <ScreenLink
          to={
            canSave ? undefined : (
              <ContactScreen accountId={accountId} contactId={contactId} />
            )
          }
          label={translate({ en: "Edit contact", it: "Modifica contatto" })}
        />
      )}
      {contactId === accountId ? (
        <BottomTabNavigation accountId={accountId} enabled={!canSave} />
      ) : null}
    </Fragment>
  );
}
