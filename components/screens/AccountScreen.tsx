import { useLingui } from "@lingui/react/macro";
import * as Clipboard from "expo-clipboard";
import { Fragment, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import {
  AccountId,
  accountIdFromAccountSecret,
  generateAccountSecret,
} from "../cryptography/cryptography";
import { accountLatest, updateAccount } from "../queries/accounts";
import { ScreenLink } from "../Routing";
import {
  refreshMemitaQueries,
  useMemitaMutation,
  useMemitaQuery,
} from "../store/dataApi";
import { useDeviceSettings } from "../store/deviceSettingsStorage";
import { useTheme } from "../Theme";
import { CryptoAvatar } from "../ui/CryptoAvatar";
import { ProfileScreen } from "./ProfileScreen";
import { SelectAccountScreen } from "./SelectAccountScreen";

export function AccountScreen({ accountId }: { accountId?: AccountId }) {
  const { t } = useLingui();
  const theme = useTheme();

  const latest = useMemitaQuery(accountLatest, { accountId: accountId }) ?? {
    name: "",
  };
  const update = useMemitaMutation(updateAccount);

  const nameOriginal = latest.name;
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    setNameInput(nameOriginal);
  }, [nameOriginal]);

  const canSave = nameInput !== nameOriginal;

  const deviceSettings = useDeviceSettings();
  const deviceId = accountId
    ? deviceSettings.cryptoPublicKeys[accountId]
    : undefined;

  const [newAccountSecret, setNewAccountSecret] = useState(
    generateAccountSecret,
  );
  const newAccountId = accountIdFromAccountSecret(newAccountSecret);

  return (
    <Fragment>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <ScreenLink
          to={!canSave ? <SelectAccountScreen /> : undefined}
          label={t`Use another account`}
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
                    await deviceSettings.removeAccount(accountId);
                    return <SelectAccountScreen />;
                  }
                : undefined
            }
            icon="trash"
            hideLabel
            label={t`Remove account from this device`}
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
            label={t`Discard changes`}
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
                      await deviceSettings.addAccount(newAccountSecret);
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
            label={accountId ? t`Save changes` : t`Create account`}
          />
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 8 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshMemitaQueries} />
        }
      >
        <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8 }}>
          <Pressable
            onPress={() => {
              setNewAccountSecret(generateAccountSecret());
            }}
          >
            <CryptoAvatar accountId={accountId ?? newAccountId} />
          </Pressable>
          {!accountId && (
            <View>
              <Text
                style={theme.textStyle}
              >{t`This will your avatar forever, choose wisely`}</Text>
              <Text style={theme.secondaryTextStyle}>{t`Tap to change`}</Text>
            </View>
          )}
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text
            style={{ ...theme.secondaryTextStyle, fontWeight: "bold" }}
          >{t`Account name`}</Text>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            style={{
              ...theme.textInputStyle,
              color: nameInput ? theme.textColor : theme.secondaryTextColor,
            }}
            placeholder={t`This name is only visible to you on this device`}
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
        {accountId && (
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View
              style={{
                gap: 2,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flex: 1,
              }}
            >
              <Text
                style={{ ...theme.secondaryTextStyle, fontWeight: "bold" }}
              >{t`Account ID`}</Text>
              <Text style={{ ...theme.textStyle }}>{accountId}</Text>
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
              label={t`Copy account id to clipboard`}
            />
          </View>
        )}
        {accountId && (
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View
              style={{
                gap: 2,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flex: 1,
              }}
            >
              <Text
                style={{ ...theme.secondaryTextStyle, fontWeight: "bold" }}
              >{t`Device ID`}</Text>
              <Text style={theme.textStyle}>{deviceId}</Text>
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
              label={t`Copy device id to clipboard`}
            />
          </View>
        )}
      </ScrollView>
      <ScreenLink
        to={
          !canSave && accountId ? (
            <ProfileScreen accountId={accountId} contactId={accountId} />
          ) : undefined
        }
        label={t`Profile`}
      />
    </Fragment>
  );
}
