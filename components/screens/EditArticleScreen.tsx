import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { dataApi } from "../persistance/dataApi";
import { allQueries } from "../persistance/Queries";
import { queryClient } from "../queryClient";
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

  const articleQuery = useSuspenseQuery(
    {
      queryKey: ["articleLatest", { accountId, createdAt }],
      async queryFn() {
        if (!createdAt) {
          return {
            content: "",
          };
        }
        return dataApi.read((root) =>
          allQueries(root).articleLatest(accountId, createdAt)
        );
      },
    },
    queryClient
  );

  const { mutateAsync: updateArticle } = useMutation(
    {
      async mutationFn({
        accountId,
        createdAt,
        content,
      }: {
        accountId: string;
        createdAt: number;
        content: string;
      }) {
        await dataApi.write((root) =>
          allQueries(root).updateArticle({
            accountId,
            createdAt,
            content,
          })
        );
      },
      async onSuccess() {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["articles", { accountId }],
          }),
          queryClient.invalidateQueries({
            queryKey: ["articleLatest", { accountId, createdAt }],
          }),
        ]);
      },
    },
    queryClient
  );

  const [contentInput, setContentInput] = useState("");
  const contentOriginal = articleQuery.data.content;
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
      <View
        style={{
          gap: 2,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexGrow: 1,
        }}
      >
        <TextInput
          value={contentInput}
          onChangeText={setContentInput}
          style={{ ...theme.textInputStyle, flexGrow: 1 }}
          multiline
        />
        {contentInput !== contentOriginal ? (
          <Text
            style={{
              ...theme.secondaryTextStyle,
              textDecorationLine: "line-through",
            }}
          >
            {contentOriginal || " "}
          </Text>
        ) : null}
      </View>
      <View style={{ paddingVertical: 8 }}>
        {createdAt ? (
          <ScreenLink
            to={async () => {
              await updateArticle({
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
                await updateArticle({
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
