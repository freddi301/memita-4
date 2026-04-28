import { useLingui } from "@lingui/react/macro";
import { Image } from "expo-image";
import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { accountList } from "../queries/accounts";
import { ScreenLink } from "../Routing";
import { refreshMemitaQueries, useMemitaQuery } from "../store/dataApi";
import { useTheme } from "../Theme";
import { AccountScreen } from "./AccountScreen";
import { DeviceSettingsScreen } from "./DeviceSettingsScreen";
import { DirectMessagesScreen } from "./DirectMessagesScreen";

export function SelectAccountScreen() {
  const theme = useTheme();
  const { t } = useLingui();

  const accounts = useMemitaQuery(accountList, {});

  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <ScreenLink
          icon="gear"
          to={<DeviceSettingsScreen />}
          label={t`Settings`}
        />
        <View style={{ flexGrow: 1 }} />
        <ScreenLink
          to={<AccountScreen />}
          icon="plus"
          label={t`Create new account`}
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
            fontSize: theme.textStyle.fontSize * 2,
            fontWeight: "bold",
          }}
        >
          {t`Memita`}
        </Text>
      </View>
      <FlatList
        data={accounts}
        renderItem={({ item }) => (
          <ScreenLink
            to={<DirectMessagesScreen accountId={item.accountId} />}
            icon="user-circle"
            label={item.name}
          />
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
        style={{ flex: 1, paddingVertical: 8 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
        refreshing={false}
        onRefresh={refreshMemitaQueries}
      />
    </Fragment>
  );
}
