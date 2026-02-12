import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { dataApi } from "../persistance/dataApi";
import { allQueries } from "../queries/Queries";
import { queryClient } from "../queryClient";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { DirectMessagesScreen } from "./DirectMessagesScreen";

export function ContactScreen({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId?: string;
}) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const contactQuery = useSuspenseQuery(
    {
      queryKey: ["contactLatest", { accountId, contactId }],
      async queryFn() {
        if (!contactId) {
          return {
            name: "",
          };
        }
        return dataApi.read((root) =>
          allQueries(root).contactLatest(accountId, contactId!)
        );
      },
    },
    queryClient
  );

  const { mutateAsync: updateContact } = useMutation(
    {
      async mutationFn({
        accountId,
        contactId,
        name,
        deleted,
      }: {
        accountId: string;
        contactId: string;
        name: string;
        deleted: boolean;
      }) {
        await dataApi.write((root) =>
          allQueries(root).updateContact({
            accountId,
            contactId,
            name,
            deleted,
          })
        );
      },
      async onSuccess() {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["contacts", { accountId }],
          }),
          queryClient.invalidateQueries({
            queryKey: ["contactLatest", { accountId, contactId }],
          }),
        ]);
      },
    },
    queryClient
  );

  const [contactIdInput, setContactIdInput] = useState("");
  const isContactIdValid = !contactId ? contactIdInput.length > 5 : true; // TODO

  const [nameInput, setNameInput] = useState("");
  const nameOriginal = contactQuery.data.name;
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = isContactIdValid && nameInput !== nameOriginal;

  return (
    <Fragment>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ScreenLink
          to={<DirectMessagesScreen accountId={accountId} />}
          icon="arrow-left"
          hideLabel
          label={translate({
            en: "Go to direct messages",
            it: "Vai ai messaggi diretti",
          })}
          enabled={!canSave}
        />
        <Text style={theme.textStyle}>
          {translate({
            en: "Contact",
            it: "Contatto",
          })}
        </Text>
      </View>
      <ScrollView style={{ flex: 1 }}>
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
      <View style={{ paddingVertical: 8 }}>
        {contactId ? (
          <ScreenLink
            to={async () => {
              await updateContact({
                accountId,
                contactId,
                name: nameOriginal,
                deleted: false,
              });
              return <DirectMessagesScreen accountId={accountId} />;
            }}
            icon="trash"
            label={translate({
              en: "Delete contact",
              it: "Elimina contatto",
            })}
            enabled={!canSave}
          />
        ) : null}
        {canSave ? (
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {contactId ? (
              <ScreenLink
                to={async () => {
                  setNameInput(nameOriginal);
                }}
                icon="undo"
                label={translate({
                  en: "Discard changes",
                  it: "Scarta modifiche",
                })}
              />
            ) : (
              <View />
            )}
            <ScreenLink
              to={async () => {
                await updateContact({
                  accountId,
                  contactId: contactId || contactIdInput,
                  name: nameInput,
                  deleted: true,
                });
                if (!contactId) {
                  return (
                    <ContactScreen
                      accountId={accountId}
                      contactId={contactIdInput}
                    />
                  );
                }
              }}
              icon="save"
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
        ) : null}
      </View>
    </Fragment>
  );
}
