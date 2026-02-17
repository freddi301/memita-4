import { Fragment, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useMemitaMutation, useMemitaQuery } from "../persistance/dataApi";
import { articleLatest, updateArticle } from "../queries/articles";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { ArticlesScreen } from "./ArticlesScreen";

export function EditArticleScreen({
  accountId,
  createdAt,
}: {
  accountId: string;
  createdAt?: number;
}) {
  const { translate } = useTranslate();
  const theme = useTheme();

  const latest = useMemitaQuery(articleLatest, {
    accountId,
    createdAt: createdAt ?? 0,
  })[0] ?? { content: "" };

  const update = useMemitaMutation(updateArticle);

  const [contentInput, setContentInput] = useState("");
  const contentOriginal = latest.content;
  useEffect(() => {
    setContentInput(contentOriginal);
  }, [contentOriginal]);

  const canSave = contentInput !== contentOriginal;

  return (
    <Fragment>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ScreenLink
          to={!canSave ? <ArticlesScreen accountId={accountId} /> : undefined}
          icon="arrow-left"
          hideLabel
          label={translate({
            en: "Go to articles",
            it: "Vai agli articoli",
          })}
        />
        {createdAt ? (
          <Text style={{ ...theme.textStyle, flexGrow: 1 }}>
            {new Date(createdAt).toLocaleString()}
          </Text>
        ) : (
          <Text style={{ ...theme.secondaryTextStyle, flexGrow: 1 }}>
            {translate({
              en: "New article",
              it: "Nuovo articolo",
            })}
          </Text>
        )}
        <View style={{ flexDirection: "row" }}>
          <ScreenLink
            to={
              !canSave && createdAt
                ? async () => {
                    await update({
                      accountId,
                      createdAt,
                      content: "",
                    });
                    return <ArticlesScreen accountId={accountId} />;
                  }
                : undefined
            }
            icon="trash"
            hideLabel
            label={translate({
              en: "Delete article",
              it: "Elimina articolo",
            })}
          />
          <ScreenLink
            to={
              canSave && createdAt
                ? async () => {
                    setContentInput(contentOriginal);
                  }
                : undefined
            }
            icon="undo"
            hideLabel
            label={translate({
              en: "Discard changes",
              it: "Scarta modifiche",
            })}
          />
          <ScreenLink
            to={
              canSave
                ? async () => {
                    if (createdAt) {
                      await update({
                        accountId,
                        createdAt,
                        content: contentInput,
                      });
                    } else {
                      const now = Date.now();
                      await update({
                        accountId,
                        createdAt: now,
                        content: contentInput,
                      });
                      return (
                        <EditArticleScreen
                          accountId={accountId}
                          createdAt={now}
                        />
                      );
                    }
                  }
                : undefined
            }
            icon="save"
            hideLabel
            label={
              createdAt
                ? translate({
                    en: "Update article",
                    it: "Aggiorna articolo",
                  })
                : translate({
                    en: "Create article",
                    it: "Crea articolo",
                  })
            }
          />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            gap: 2,
          }}
        >
          <TextInput
            value={contentInput}
            onChangeText={setContentInput}
            style={{ ...theme.textInputStyle, height: 300 }}
            multiline
          />
          {contentInput !== contentOriginal ? (
            <ScrollView style={{ height: 300 }}>
              <Text
                style={{
                  ...theme.secondaryTextStyle,
                  textDecorationLine: "line-through",
                }}
              >
                {contentOriginal || " "}
              </Text>
            </ScrollView>
          ) : null}
        </View>
      </ScrollView>
    </Fragment>
  );
}
