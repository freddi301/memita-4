import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useLayoutEffect, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { ScreenLink } from "../Routing";
import { ContentAddress, storeFile } from "../store/fileStore";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { AttachmentPreview } from "./AttachmentPreview";

// refactor this to DirectMessageCompose and split to smaller files

type MessageShape = {
  isDraft: boolean;
  content: string;
  attachments: Array<{ name: string; hash: ContentAddress }>;
};

export function MessageCompose({
  onUpdate,
  toModify,
}: {
  toModify: MessageShape | undefined;
  onUpdate(params: MessageShape): Promise<void>;
}) {
  const theme = useTheme();
  const { translate } = useTranslate();

  const [text, setText] = useState("");
  useLayoutEffect(() => {
    setText(toModify?.content ?? "");
  }, [toModify?.content]);

  const [files, setFiles] = useState<
    Array<{ name: string; hash: ContentAddress }>
  >([]);

  const [selectedFileIndex, setSelectedFileIndex] = useState<number>();

  return (
    <View style={{ borderTopWidth: 1, borderColor: theme.separatorColor }}>
      <ScrollView horizontal>
        {files.map((file, index) => {
          const isSelected = index === selectedFileIndex;
          return (
            <Pressable
              key={index}
              onLongPress={() => {
                setSelectedFileIndex(index);
              }}
              style={{ position: "relative" }}
            >
              <AttachmentPreview file={file} />
              {isSelected && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                  }}
                >
                  <ScreenLink
                    to={async () => {
                      setFiles(files.filter((_, i) => i !== index));
                      setSelectedFileIndex(undefined);
                    }}
                    icon="trash"
                    hideLabel
                    label={translate({
                      en: "Remove",
                      it: "Rimuovi",
                    })}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
        }}
      >
        <ScreenLink
          to={async () => {
            // TODO try also with @react-native-documents/picker might work better on android devices
            const result = await DocumentPicker.getDocumentAsync({
              multiple: true,
              base64: false,
            });
            if (!result.canceled) {
              const newFiles = await Promise.all(
                result.assets.map(async (asset) => {
                  if (Platform.OS === "web") {
                    const response = await fetch(asset.uri);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const hash = await storeFile(new Uint8Array(arrayBuffer));
                    return { name: asset.name, hash };
                  } else {
                    const file = new FileSystem.File(asset.uri);
                    const hash = await storeFile(await file.bytes());
                    return { name: asset.name, hash };
                  }
                }),
              );
              setFiles((prev) => [...prev, ...newFiles]);
            }
          }}
          icon="paperclip"
          hideLabel
          label={translate({
            en: "Attach file",
            it: "Allega file",
          })}
        />
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
                  text !== "" || files.length > 0
                    ? async () => {
                        await onUpdate({
                          content: text,
                          attachments: files,
                          isDraft: true,
                        });
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
                  await onUpdate({
                    content: text,
                    attachments: files,
                    isDraft: true,
                  });
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
                  await onUpdate({
                    content: text,
                    attachments: files,
                    isDraft: false,
                  });
                  setText("");
                  setFiles([]);
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
                        await onUpdate({
                          content: text,
                          attachments: files,
                          isDraft: false,
                        });
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
                  await onUpdate({
                    content: "",
                    attachments: [],
                    isDraft: toModify.isDraft,
                  });
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
    </View>
  );
}

if (Platform.OS === "web") {
  const style = document.createElement("style");
  style.textContent = "textarea { field-sizing: content; }";
  document.head.appendChild(style);
}
