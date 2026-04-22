import { FontAwesome } from "@expo/vector-icons";
import { Fragment } from "react";
import { FlatList, Text, View } from "react-native";
import { AccountId } from "../cryptography/cryptography";
import { articleList } from "../queries/articles";
import { ScreenLink } from "../Routing";
import { useMemitaQuery } from "../store/dataApi";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { EditArticleScreen } from "./EditArticleScreen";
import { ProfileScreen } from "./ProfileScreen";

export function ArticlesScreen({ accountId }: { accountId: AccountId }) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const articles = useMemitaQuery(articleList, { accountId });

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
          <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ScreenLink
                to={<ProfileScreen accountId={accountId} contactId={item.contactId} />}
                label={item.contactName}
                styleOverride={{
                  flexGrow1: true,
                  hasPadding: false,
                }}
              />
              {item.contactId === accountId ? (
                <ScreenLink
                  to={<EditArticleScreen accountId={accountId} createdAt={item.createdAt} />}
                  icon="pencil"
                  hideLabel
                  label={translate({
                    en: "Edit article",
                    it: "Modifica articolo",
                  })}
                  styleOverride={{
                    hasPadding: false,
                  }}
                />
              ) : null}
              <Text style={{ ...theme.secondaryTextStyle }}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            {item.date && (
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <FontAwesome name="calendar" color={theme.secondaryTextStyle.color} size={18} />
                <Text style={{ ...theme.secondaryTextStyle }}>
                  {new Date(item.date.timestamp).toLocaleString()}
                  {/*  {" - "} {new Date(
                    item.date.timestamp + item.date.duration
                  ).toLocaleString()} */}
                </Text>
              </View>
            )}
            <Text style={{ ...theme.textStyle }}>{item.content}</Text>
          </View>
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
              en: "No articles",
              it: "Nessun articolo",
            })}
          </Text>
        )}
      />
      <BottomTabNavigation accountId={accountId} enabled={true} />
    </Fragment>
  );
}
