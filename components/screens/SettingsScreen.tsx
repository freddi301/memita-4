import { Fragment } from "react";
import { ScrollView, Text, View } from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { AccountId } from "../cryptography/cryptography";
import { refreshMemitaQueries } from "../store/dataApi";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";

export function SettingsScreen({ accountId }: { accountId: AccountId }) {
  const theme = useTheme();
  const { translate } = useTranslate();

  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <Text
          style={{
            ...theme.textStyle,
            fontWeight: "bold",
            paddingLeft: 16,
            flexGrow: 1,
          }}
        >
          {translate({ en: "Settings", it: "Impostazioni" })}
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refreshMemitaQueries} />}
      ></ScrollView>
      <BottomTabNavigation accountId={accountId} enabled={true} />
    </Fragment>
  );
}
