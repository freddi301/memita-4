import { FontAwesome } from "@expo/vector-icons";
import { Fragment } from "react";
import { FlatList, TextInput, View } from "react-native";
import { useTheme } from "../Theme";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";

export function DirectMessagesScreen({ accountId }: { accountId: string }) {
  const theme = useTheme();
  return (
    <Fragment>
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        <TextInput style={{ ...theme.textInputStyle, flexGrow: 1 }} />
        <FontAwesome
          name="search"
          color={theme.linkTextColor}
          style={{
            paddingHorizontal: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.linkTextColor,
          }}
        />
      </View>
      <FlatList data={[]} renderItem={() => null} style={{ flexGrow: 1 }} />
      <BottomTabNavigation accountId={accountId} />
    </Fragment>
  );
}
