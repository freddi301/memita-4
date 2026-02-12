import { useSuspenseQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { FlatList, View } from "react-native";
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
        <View style={{ flexGrow: 1 }} />
        <ScreenLink
          to={<ContactScreen accountId={accountId} />}
          icon="user-plus"
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
        style={{ flex: 1, marginVertical: 8 }}
      />
      <BottomTabNavigation accountId={accountId} />
    </Fragment>
  );
}
