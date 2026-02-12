import { useSuspenseQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { dataApi } from "../persistance/dataApi";
import { allQueries } from "../persistance/Queries";
import { queryClient } from "../queryClient";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { AccountScreen } from "./AccountScreen";

export function SelectAccountScreen() {
  const theme = useTheme();
  const { translate } = useTranslate();
  const { data: accounts } = useSuspenseQuery(
    {
      queryKey: ["accounts"],
      queryFn: () => dataApi.read((root) => allQueries(root).accountList),
    },
    queryClient
  );
  return (
    <Fragment>
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
          <View style={{ paddingVertical: 8 }}>
            <ScreenLink
              to={<AccountScreen accountId={item.id} />}
              icon="user-circle"
              label={item.name}
            />
          </View>
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
      />
      <View
        style={{
          justifyContent: "center",
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
    </Fragment>
  );
}
