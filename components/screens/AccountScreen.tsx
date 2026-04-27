import { useLingui } from "@lingui/react/macro";
import * as Clipboard from "expo-clipboard";
import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
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
import { useDeviceSettingsStore as useDeviceSettings } from "../store/deviceSettingsStorage";
import { useTheme } from "../Theme";
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
                      const newAccountSecret = generateAccountSecret();
                      const newAccountId =
                        accountIdFromAccountSecret(newAccountSecret);
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
            <Text style={theme.secondaryTextStyle}>{t`Account ID`}</Text>
            {accountId ? (
              <Text style={{ ...theme.textStyle }}>{accountId}</Text>
            ) : (
              <Text style={theme.secondaryTextStyle}>
                {t`Account id will be generated on save`}
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
            label={t`Copy account id to clipboard`}
          />
        </View>
        <View style={{ gap: 2, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={theme.secondaryTextStyle}>{t`Account name`}</Text>
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
            <Text style={theme.secondaryTextStyle}>{t`Device ID`}</Text>
            {deviceId ? (
              <Text style={theme.textStyle}>{deviceId}</Text>
            ) : (
              <Text style={theme.secondaryTextStyle}>
                {t`Device id will be generated on save`}
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
            label={t`Copy device id to clipboard`}
          />
        </View>
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
