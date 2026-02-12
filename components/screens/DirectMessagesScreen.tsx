import { Fragment } from "react";
import { FlatList, View } from "react-native";
import { useMemitaQuery } from "../persistance/dataApi";
import { contactList } from "../queries/contacts";
import { ScreenLink } from "../Routing";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { ContactScreen } from "./ContactScreen";

export function DirectMessagesScreen({ accountId }: { accountId: string }) {
  const { translate } = useTranslate();

  const contacts = useMemitaQuery(contactList, { accountId });

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
