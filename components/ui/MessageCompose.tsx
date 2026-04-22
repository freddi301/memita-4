import { useLayoutEffect, useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";

export function MessageCompose({
  onUpdate,
  toModify,
}: {
  toModify: undefined | { isDraft: boolean; content: string };
  onUpdate(params: { content: string; isDraft: boolean }): Promise<void>;
}) {
  const theme = useTheme();
  const { translate } = useTranslate();

  const [text, setText] = useState("");
  useLayoutEffect(() => {
    setText(toModify?.content ?? "");
  }, [toModify?.content]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        borderTopWidth: 1,
        borderColor: theme.separatorColor,
        paddingLeft: 16,
      }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={Platform.OS === "web" ? 1 : undefined}
        style={{
          ...theme.textInputStyle,
          flex: 1,
          paddingVertical: 8,
          maxHeight: 400,
        }}
      />
      {(() => {
        if (!toModify) {
          // create draft
          return (
            <ScreenLink
              to={
                text !== ""
                  ? async () => {
                      await onUpdate({ content: text, isDraft: true });
                    }
                  : undefined
              }
              icon="sticky-note"
              hideLabel
              label={translate({
                en: "New draft",
                it: "Nuova bozza",
              })}
            />
          );
        } else if (toModify.isDraft && text !== toModify.content) {
          // update draft
          return (
            <ScreenLink
              to={async () => {
                await onUpdate({ content: text, isDraft: true });
              }}
              icon="save"
              hideLabel
              label={translate({
                en: "Save draft",
                it: "Salva bozza",
              })}
            />
          );
        } else if (toModify.isDraft && text === toModify.content) {
          // publish draft
          return (
            <ScreenLink
              to={async () => {
                await onUpdate({ content: text, isDraft: false });
              }}
              icon="send"
              hideLabel
              label={translate({
                en: "Send message",
                it: "Invia messaggio",
              })}
            />
          );
        } else if (!toModify.isDraft) {
          // update message
          return (
            <ScreenLink
              to={
                text !== toModify.content
                  ? async () => {
                      await onUpdate({ content: text, isDraft: false });
                    }
                  : undefined
              }
              icon="save"
              hideLabel
              label={translate({
                en: "Modify message",
                it: "Modifica messaggio",
              })}
            />
          );
        } else if (text === "") {
          // delete it
          return (
            <ScreenLink
              to={async () => {
                await onUpdate({ content: "", isDraft: toModify.isDraft });
              }}
              icon="trash"
              hideLabel
              label={translate({
                en: "Delete",
                it: "Elimina",
              })}
            />
          );
        } else {
          throw new Error("Invalid state");
        }
      })()}
    </View>
  );
}

if (Platform.OS === "web") {
  const style = document.createElement("style");
  style.textContent = "textarea { field-sizing: content; }";
  document.head.appendChild(style);
}
