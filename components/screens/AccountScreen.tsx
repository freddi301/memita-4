import * as Clipboard from "expo-clipboard";
import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import {
  refreshMemitaQueries,
  useMemitaMutation,
  useMemitaQuery,
} from "../persistance/dataApi";
import {
  accountLatest,
  createAccountId,
  updateAccount,
} from "../queries/accounts";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { ProfileScreen } from "./ProfileScreen";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function AccountScreen({ accountId }: { accountId?: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const latest = useMemitaQuery(accountLatest, {
    accountId: accountId ?? "",
  })[0] ?? { name: "" };
  const update = useMemitaMutation(updateAccount);

  const nameOriginal = latest.name;
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = nameInput !== nameOriginal;

  return (
    <Fragment>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <ScreenLink
          to={!canSave ? <SelectAccountScreen /> : undefined}
          label={translate({
            en: "Use another account",
            it: "Usa un altro account",
          })}
        />
        <View style={{ flexDirection: "row" }}>
          <ScreenLink
            to={
              !canSave && accountId !== undefined
                ? async () => {
                    await update({
                      accountId,
                      name: nameOriginal,
                      deleted: true,
                    });
                    return <SelectAccountScreen />;
                  }
                : undefined
            }
            icon="trash"
            hideLabel
            label={translate({
              en: "Remove account from this device",
              it: "Rimuovi account da questo dispositivo",
            })}
          />
          <ScreenLink
            to={
              canSave
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
                    if (accountId) {
                      await update({
                        accountId,
                        name: nameInput,
                        deleted: false,
                      });
                    } else {
                      const newAccountId = createAccountId();
                      await update({
                        accountId: newAccountId,
                        name: nameInput,
                        deleted: false,
                      });
                      return (
                        <ProfileScreen
                          accountId={newAccountId}
                          contactId={newAccountId}
                        />
                      );
                    }
                  }
                : undefined
            }
            icon="save"
            hideLabel
            label={
              accountId
                ? translate({
                    en: "Save changes",
                    it: "Salva modifiche",
                  })
                : translate({
                    en: "Create account",
                    it: "Crea account",
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
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={theme.secondaryTextStyle}>
              {translate({
                en: "Account ID",
                it: "Id dell'account",
              })}
            </Text>
            {accountId ? (
              <Text style={theme.textStyle}>{accountId}</Text>
            ) : (
              <Text style={theme.secondaryTextStyle}>
                {translate({
                  en: "Account id will be generated on save",
                  it: "L'id dell'account sarà generato al salvataggio",
                })}
              </Text>
            )}
          </View>
          <ScreenLink
            to={
              accountId
                ? async () => {
                    await Clipboard.setStringAsync(accountId);
                  }
                : undefined
            }
            icon="copy"
            hideLabel
            label={translate({
              en: "Copy account id to clipboard",
              it: "Copia l'id dell'account negli appunti",
            })}
          />
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>
            {translate({
              en: "Account name",
              it: "Nome dell'account",
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
          !canSave && accountId ? (
            <ProfileScreen accountId={accountId} contactId={accountId} />
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
