import { useLayoutEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";

export function MessageCompose({
  onSend,
  toModifyContent,
}: {
  toModifyContent: undefined | string;
  onSend(text: string): Promise<void>;
}) {
  const theme = useTheme();
  const { translate } = useTranslate();

  const [text, setText] = useState("");
  useLayoutEffect(() => {
    setText(toModifyContent ?? "");
  }, [toModifyContent]);

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
        style={{
          ...theme.textInputStyle,
          flex: 1,
          paddingVertical: 8,
        }}
      />
      <ScreenLink
        to={async () => {
          await onSend(text);
          setText("");
        }}
        icon={toModifyContent ? "save" : "send"}
        hideLabel
        label={translate({
          en: "Send message",
          it: "Invia messaggio",
        })}
      />
    </View>
  );
}
