import { useSuspenseQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { dataApi } from "../persistance/dataApi";
import { allQueries } from "../persistance/Queries";
import { queryClient } from "../queryClient";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { EditArticleScreen } from "./EditArticleScreen";

export function ArticlesScreen({ accountId }: { accountId: string }) {
  const { translate } = useTranslate();
  const theme = useTheme();
  const { data: articles } = useSuspenseQuery(
    {
      queryKey: ["contacts", { accountId }],
      queryFn: () =>
        dataApi.read((root) => allQueries(root).articleList(accountId)),
    },
    queryClient
  );
  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flexGrow: 1 }} />
        <ScreenLink
          to={<EditArticleScreen accountId={accountId} />}
          icon="pencil"
          label={translate({
            en: "Create new article",
            it: "Crea nuovo articolo",
          })}
        />
      </View>
      <FlatList
        data={articles}
        renderItem={({ item }) => (
          <View style={{ gap: 4, paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ ...theme.textStyle, fontWeight: "bold" }}>
              {item.contactName}
            </Text>
            <Text style={{ ...theme.textStyle }}>{item.content}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: theme.separatorColor }} />
        )}
      />
      <BottomTabNavigation accountId={accountId} />
    </Fragment>
  );
}
