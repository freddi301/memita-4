import { FontAwesome } from "@expo/vector-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { FlatList, TextInput, View } from "react-native";
import { dataApi } from "../persistance/dataApi";
import { allQueries } from "../persistance/Queries";
import { queryClient } from "../queryClient";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { ContactScreen } from "./ContactScreen";

export function DirectMessagesScreen({ accountId }: { accountId: string }) {
  const theme = useTheme();
  const { translate } = useTranslate();
  const { data: contacts } = useSuspenseQuery(
    {
      queryKey: ["contacts", { accountId }],
      queryFn: () =>
        dataApi.read((root) => allQueries(root).contactList(accountId)),
    },
    queryClient
  );
  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <View
          style={{
            flexDirection: "row",
            paddingTop: 8,
            flexGrow: 1,
            paddingLeft: 16,
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
        <ScreenLink
          to={<ContactScreen accountId={accountId} />}
          icon="user-plus"
          hideLabel
          label={translate({
            en: "Create new contact",
            it: "Crea nuovo contatto",
          })}
        />
      </View>
      <FlatList
        data={contacts}
        renderItem={({ item }) => (
          <ScreenLink
            to={<ContactScreen accountId={accountId} contactId={item.id} />}
            label={item.name}
            icon="circle"
          />
        )}
        style={{ flexGrow: 1, marginTop: 8 }}
      />
      <BottomTabNavigation accountId={accountId} />
    </Fragment>
  );
}
