import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useMemitaMutation, useMemitaQuery } from "../persistance/dataApi";
import {
  accountLatest,
  createAccountId,
  updateAccount,
} from "../queries/accounts";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function AccountScreen({ accountId }: { accountId?: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const latest = useMemitaQuery(accountLatest, { accountId });
  const update = useMemitaMutation(updateAccount);

  const nameOriginal = latest.name;
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = nameInput !== nameOriginal;

  return (
    <Fragment>
      <ScreenLink
        to={<SelectAccountScreen />}
        icon="arrow-left"
        label={translate({
          en: "Select another account",
          it: "Seleziona un altro account",
        })}
        enabled={!canSave}
      />
      <ScrollView style={{ flex: 1 }}>
        {accountId ? (
          <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={theme.secondaryTextStyle}>
              {translate({
                en: "Account ID",
                it: "Id dell'account",
              })}
            </Text>
            <Text style={theme.textStyle}>{accountId}</Text>
          </View>
        ) : null}
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
      <View style={{ paddingVertical: 8 }}>
        {accountId ? (
          <ScreenLink
            to={async () => {
              await update({
                id: accountId,
                name: nameOriginal,
                deleted: true,
              });
              return <SelectAccountScreen />;
            }}
            icon="trash"
            label={translate({
              en: "Remove account from this device",
              it: "Rimuovi account da questo dispositivo",
            })}
            enabled={!canSave}
          />
        ) : null}
        {canSave ? (
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {accountId ? (
              <ScreenLink
                to={async () => {
                  setNameInput(nameOriginal);
                }}
                icon="undo"
                label={translate({
                  en: "Discard changes",
                  it: "Scarta modifiche",
                })}
                enabled={canSave}
              />
            ) : (
              <View />
            )}
            <ScreenLink
              to={async () => {
                const newAccountId = createAccountId();
                await update({
                  id: accountId ?? newAccountId,
                  name: nameInput,
                  deleted: false,
                });
                if (!accountId) {
                  return <AccountScreen accountId={newAccountId} />;
                }
              }}
              icon="save"
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
        ) : null}
      </View>
      {accountId ? (
        <BottomTabNavigation accountId={accountId} enabled={!canSave} />
      ) : null}
    </Fragment>
  );
}
