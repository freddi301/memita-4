import { Image } from "expo-image";
import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { refreshMemitaQueries, useMemitaQuery } from "../persistance/dataApi";
import { accountList } from "../queries/accounts";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { AccountScreen } from "./AccountScreen";

export function SelectAccountScreen() {
  const theme = useTheme();
  const { translate } = useTranslate();

  const accounts = useMemitaQuery(accountList, {});

  return (
    <Fragment>
      <View
        style={{
          justifyContent: "flex-end",
          flexDirection: "row",
        }}
      >
        <ScreenLink
          to={<AccountScreen />}
          icon="plus"
          label={translate({
            en: "Create new account",
            it: "Crea nuovo account",
          })}
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
          Memita
        </Text>
      </View>
      <FlatList
        data={accounts}
        renderItem={({ item }) => (
          <ScreenLink
            to={<AccountScreen accountId={item.accountId} />}
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
            {translate({
              en: "No accounts on this device",
              it: "Nessun account su questo dispositivo",
            })}
          </Text>
        }
        style={{
          flex: 1,
          paddingVertical: 8,
        }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
        refreshing={false}
        onRefresh={refreshMemitaQueries}
      />
    </Fragment>
  );
}
