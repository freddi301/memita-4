import { useLingui } from "@lingui/react/macro";
import { Fragment, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import { AccountId } from "../cryptography/cryptography";
import { biographyLatest, updateBiography } from "../queries/biography";
import { contactLatest } from "../queries/contacts";
import { ScreenLink } from "../Routing";
import {
  refreshMemitaQueries,
  useMemitaMutation,
  useMemitaQuery,
} from "../store/dataApi";
import { useTheme } from "../Theme";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { CoordsInput } from "../ui/CoordsInput";
import { CryptoAvatar } from "../ui/CryptoAvatar";
import { AccountScreen } from "./AccountScreen";
import { ContactScreen } from "./ContactScreen";
import { DirectConversationScreen } from "./DirectConversationScreen";

export function ProfileScreen({
  accountId,
  contactId,
}: {
  accountId: AccountId;
  contactId: AccountId;
}) {
  const theme = useTheme();
  const { t } = useLingui();

  const contact = useMemitaQuery(contactLatest, { accountId, contactId }) ?? {
    name: "",
  };

  const biography = useMemitaQuery(biographyLatest, {
    accountId: contactId,
  }) ?? { content: "", location: undefined };

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
      <View
        style={{ flexDirection: "row", alignItems: "center", paddingLeft: 16 }}
      >
        <CryptoAvatar accountId={contactId} />
        <Text
          style={{
            ...theme.textStyle,
            fontWeight: "bold",
            flexGrow: 1,
            paddingLeft: 8,
            paddingTop: 6,
          }}
        >
          {contact.name}
        </Text>
        <ScreenLink
          to={async () => {
            if (Platform.OS === "web") {
              await navigator.clipboard.writeText(contactId);
              alert(t`Profile ID copied to clipboard`);
            } else {
              await Share.share({ message: contactId });
            }
          }}
          icon="share-alt"
          hideLabel
          label={t`Share profile`}
        />
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
              label={t`Discard changes`}
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
              label={contactId ? t`Save changes` : t`Create contact`}
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
            {t`Location`}
          </Text>
          <CoordsInput value={locationInput} onChange={setLocationInput} />
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>{t`Biography`}</Text>
          {contactId === accountId ? (
            <TextInput
              value={bioInput}
              onChangeText={setBioInput}
              style={{ ...theme.textInputStyle, maxHeight: "100%" }}
              multiline
            />
          ) : (
            <Text style={{ ...theme.textStyle, paddingHorizontal: 16 }}>
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
        label={t`Direct messages`}
      />
      {accountId === contactId ? (
        <ScreenLink
          to={canSave ? undefined : <AccountScreen accountId={accountId} />}
          label={t`Account settings`}
        />
      ) : (
        <ScreenLink
          to={
            canSave ? undefined : (
              <ContactScreen accountId={accountId} contactId={contactId} />
            )
          }
          label={t`Edit contact`}
        />
      )}
      {contactId === accountId ? (
        <BottomTabNavigation accountId={accountId} enabled={!canSave} />
      ) : null}
    </Fragment>
  );
}
