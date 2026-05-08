import { useLingui } from "@lingui/react/macro";
import { Image } from "expo-image";
import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { getAccounts } from "../queries/accounts";
import { useMemitaQuery, useRefreshMemitaQueries } from "../store/dataApi";
import { useTheme } from "../Theme";
import { CryptoAvatar } from "../ui/CryptoAvatar";
import { ScreenLink } from "../ui/ScreenLink";
import { AccountScreen } from "./AccountScreen";
import { DeviceSettingsScreen } from "./DeviceSettingsScreen";
import { DirectMessagesScreen } from "./DirectMessagesScreen";
import { ImportAccountScreen } from "./ImportAccountScreen";

export function SelectAccountScreen() {
  const theme = useTheme();
  const { t } = useLingui();
  const refreshMemitaQueries = useRefreshMemitaQueries();

  const accounts = useMemitaQuery(getAccounts, undefined);

  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <ScreenLink
          icon="gear"
          to={<DeviceSettingsScreen />}
          label={t`Settings`}
        />
      </View>
      <View style={{ alignItems: "center", gap: 16, padding: 16 }}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={{ width: 100, height: 100 }}
        />
        <Text
          style={{
            ...theme.textStyle,
            fontSize: theme.fontSize * 2,
            fontWeight: "bold",
          }}
        >
          {t`Memita`}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <ScreenLink
          to={<ImportAccountScreen />}
          icon="download"
          label={t`Import account`}
        />
        <View style={{ flexGrow: 1 }} />
        <ScreenLink
          to={<AccountScreen />}
          icon="plus"
          label={t`Create new account`}
        />
      </View>
      <FlatList
        data={accounts}
        renderItem={({ item }) => (
          <ScreenLink
            to={<DirectMessagesScreen accountId={item.accountId} />}
            styleOverride={{
              flexDirection: "row",
              paddingHorizontal: 8,
              gap: 8,
              marginVertical: 4,
            }}
          >
            <CryptoAvatar
              accountId={item.accountId}
              contactId={item.accountId}
            />
            <Text
              style={{
                ...theme.textStyle,
                color: theme.linkTextColor,
                fontWeight: "bold",
                paddingTop: 10,
              }}
            >
              {item.name}
            </Text>
          </ScreenLink>
        )}
        ListEmptyComponent={
          <Text
            style={{
              ...theme.secondaryTextStyle,
              padding: 16,
              textAlign: "center",
            }}
          >
            {t`No accounts on this device`}
          </Text>
        }
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
          paddingBottom: 4,
        }}
        refreshing={false}
        onRefresh={refreshMemitaQueries}
      />
    </Fragment>
  );
}
