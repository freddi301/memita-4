import { useSuspenseQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { FlatList, Text, View } from "react-native";
import { createAccountId, dataApi } from "../dataApi";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { ListSeparator } from "../ui/ListSeparator";
import { AccountScreen } from "./AccountScreen";

export function SelectAccountScreen() {
  const theme = useTheme();
  const { translate } = useTranslate();
  const { data: accounts } = useSuspenseQuery({
    queryKey: ["accounts"],
    queryFn: dataApi.accounts.getAll,
  });
  return (
    <View style={{ height: "100%" }}>
      <View style={{ alignItems: "center" }}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={{ width: 100, height: 100, marginVertical: 20 }}
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
            to={<AccountScreen accountId={item.id} />}
            label={`👤 ${item.id}`}
          />
        )}
        ListEmptyComponent={
          <Text style={{ ...theme.secondaryTextStyle, padding: 16 }}>
            {translate({
              en: "No accounts on this device",
              it: "Nessun account su questo dispositivo",
            })}
          </Text>
        }
        ItemSeparatorComponent={ListSeparator}
        ListHeaderComponent={accounts.length ? ListSeparator : null}
        ListFooterComponent={accounts.length ? ListSeparator : null}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
      />
      <View style={{ justifyContent: "center", flexDirection: "row" }}>
        <ScreenLink
          to={async () => {
            const newAccountId = createAccountId();
            await dataApi.accounts.create({ id: newAccountId });
            return <AccountScreen accountId={newAccountId} />;
          }}
          label={translate({
            en: "Create new account",
            it: "Crea nuovo account",
          })}
        />
      </View>
    </View>
  );
}
