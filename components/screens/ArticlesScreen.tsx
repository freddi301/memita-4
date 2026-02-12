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
          <View style={{ gap: 4, paddingVertical: 8, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  ...theme.textStyle,
                  fontWeight: "bold",
                  flexGrow: 1,
                }}
              >
                {item.contactName}
              </Text>
              {item.accountId === accountId ? (
                <ScreenLink
                  to={
                    <EditArticleScreen
                      accountId={accountId}
                      createdAt={item.createdAt}
                    />
                  }
                  icon="pencil"
                  hideLabel
                  label={translate({
                    en: "Edit article",
                    it: "Modifica articolo",
                  })}
                />
              ) : null}
              <Text style={theme.secondaryTextStyle}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text style={{ ...theme.textStyle }}>{item.content}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: theme.separatorColor }} />
        )}
        style={{ flex: 1 }}
      />
      <BottomTabNavigation accountId={accountId} />
    </Fragment>
  );
}
