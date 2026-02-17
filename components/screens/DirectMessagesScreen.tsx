import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { useMemitaQuery } from "../persistance/dataApi";
import { contactList } from "../queries/contacts";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { ContactScreen } from "./ContactScreen";

export function DirectMessagesScreen({ accountId }: { accountId: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();

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
            to={
              <ContactScreen accountId={accountId} contactId={item.contactId} />
            }
            label={item.name}
            icon="circle"
          />
        )}
        style={{ flex: 1, marginVertical: 8 }}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={() => (
          <Text
            style={{
              ...theme.secondaryTextStyle,
              textAlign: "center",
            }}
          >
            {translate({
              en: "No messages",
              it: "Nessun messagio",
            })}
          </Text>
        )}
      />
      <BottomTabNavigation accountId={accountId} />
    </Fragment>
  );
}
