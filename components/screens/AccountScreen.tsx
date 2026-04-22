import { hexToBytes } from "@noble/hashes/utils.js";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import { getDeviceKeyPair } from "../cryptography";
import {
  accountLatest,
  createAccountId,
  updateAccount,
} from "../queries/accounts";
import { ScreenLink } from "../Routing";
import {
  queryClient,
  refreshMemitaQueries,
  store,
  useMemitaMutation,
  useMemitaQuery,
} from "../store/dataApi";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { ProfileScreen } from "./ProfileScreen";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function AccountScreen({ accountId }: { accountId?: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const latest = useMemitaQuery(accountLatest, {
    accountId: accountId ?? "",
  }) ?? { name: "" };
  const update = useMemitaMutation(updateAccount);

  const nameOriginal = latest.name;
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = nameInput !== nameOriginal;

  const deviceId =
    useSuspenseQuery(
      {
        queryKey: ["deviceId", accountId],
        queryFn: async () => {
          if (!accountId) return null;
          const { publicKey } = await getDeviceKeyPair(accountId);
          return publicKey;
        },
      },
      queryClient,
    ).data ?? undefined;

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
              !canSave && accountId !== undefined && deviceId !== undefined
                ? async () => {
                    await update({
                      accountId,
                      name: nameOriginal,
                      deleted: true,
                    });
                    await store.stop(hexToBytes(deviceId));
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
                      const deviceKeyPair =
                        await getDeviceKeyPair(newAccountId);
                      await store.start(
                        hexToBytes(deviceKeyPair.publicKey),
                        hexToBytes(deviceKeyPair.secretKey),
                      );
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
          <View
            style={{
              gap: 2,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flex: 1,
            }}
          >
            <Text style={theme.secondaryTextStyle}>
              {translate({
                en: "Account ID",
                it: "Id dell'account",
              })}
            </Text>
            {accountId ? (
              <Text style={{ ...theme.textStyle }}>{accountId}</Text>
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
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View
            style={{
              gap: 2,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flex: 1,
            }}
          >
            <Text style={theme.secondaryTextStyle}>
              {translate({
                en: "Device ID",
                it: "Id del dispositivo",
              })}
            </Text>
            {deviceId ? (
              <Text style={theme.textStyle}>{deviceId}</Text>
            ) : (
              <Text style={theme.secondaryTextStyle}>
                {translate({
                  en: "Device id will be generated on save",
                  it: "L'id del dispositivo sarà generato al salvataggio",
                })}
              </Text>
            )}
          </View>
          <ScreenLink
            to={
              deviceId
                ? async () => {
                    await Clipboard.setStringAsync(deviceId);
                  }
                : undefined
            }
            icon="copy"
            hideLabel
            label={translate({
              en: "Copy device id to clipboard",
              it: "Copia l'id del dispositivo negli appunti",
            })}
          />
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
