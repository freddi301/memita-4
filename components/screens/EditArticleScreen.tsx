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

  const latest = useMemitaQuery(articleLatest, { accountId, createdAt });

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
          to={<ArticlesScreen accountId={accountId} />}
          icon="arrow-left"
          hideLabel
          label={translate({
            en: "Go to articles",
            it: "Vai agli articoli",
          })}
          enabled={!canSave}
        />
        <Text style={{ ...theme.secondaryTextStyle, flexGrow: 1 }}>
          {translate({
            en: "Article",
            it: "Articolo",
          })}
        </Text>
        {createdAt ? (
          <Text style={{ ...theme.textStyle, paddingHorizontal: 16 }}>
            {new Date(createdAt).toLocaleString()}
          </Text>
        ) : null}
      </View>
      <ScrollView style={{ flex: 1 }}>
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
      <View style={{ paddingVertical: 8 }}>
        {createdAt ? (
          <ScreenLink
            to={async () => {
              await update({
                accountId,
                createdAt,
                content: "",
              });
              return <ArticlesScreen accountId={accountId} />;
            }}
            icon="trash"
            label={translate({
              en: "Delete article",
              it: "Elimina articolo",
            })}
            enabled={!canSave}
          />
        ) : null}
        {canSave ? (
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {createdAt ? (
              <ScreenLink
                to={async () => {
                  setContentInput(contentOriginal);
                }}
                icon="undo"
                label={translate({
                  en: "Discard changes",
                  it: "Scarta modifiche",
                })}
              />
            ) : (
              <View />
            )}
            <ScreenLink
              to={async () => {
                const now = Date.now();
                await update({
                  accountId,
                  createdAt: createdAt ?? now,
                  content: contentInput,
                });
                if (!createdAt) {
                  return (
                    <EditArticleScreen accountId={accountId} createdAt={now} />
                  );
                }
              }}
              icon="save"
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
        ) : null}
      </View>
    </Fragment>
  );
}
