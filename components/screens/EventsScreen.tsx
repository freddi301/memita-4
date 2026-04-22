import { Fragment } from "react";
import { Text, View } from "react-native";
import { AccountId } from "../cryptography/cryptography";
import { articleList } from "../queries/articles";
import { useMemitaQuery } from "../store/dataApi";
import { useTheme } from "../Theme";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { MemitaCalendar } from "../ui/MemitaCalendar";

export function EventsScreen({ accountId }: { accountId: AccountId }) {
  const theme = useTheme();

  const articles = useMemitaQuery(articleList, { accountId });
  const events = articles
    .filter((article) => article.date !== undefined)
    .map((article) => {
      return {
        id: `${article.contactId}-${article.createdAt}`,
        start: article.date!.timestamp,
        duration: article.date!.duration,
        content: (
          <View key={`${article.contactId}-${article.createdAt}`}>
            <Text style={{ ...theme.textStyle, fontWeight: "bold" }}>{article.contactName}</Text>
            <Text style={theme.textStyle}>{article.content}</Text>
          </View>
        ),
      };
    });

  return (
    <Fragment>
      <MemitaCalendar events={events} />
      <BottomTabNavigation accountId={accountId} enabled={true} />
    </Fragment>
  );
}
