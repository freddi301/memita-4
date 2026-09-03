import { FontAwesome } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import filetypeinfo from "magic-bytes.js";
import { Fragment, use, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../Theme";
import {
  ContentAddress,
  getFileUri,
  loadFileMagicBytes,
} from "../store/fileStore";

// TODO show file size and type

const PREVIEWABLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/apng",
  "image/webp",
  "image/bmp",
  "image/heif",
  "image/avif",
]);

type AttachmentKind = "image" | "video" | "audio" | "other";

function getAttachmentKind(fileType: string | undefined): AttachmentKind {
  if (fileType && PREVIEWABLE_IMAGE_TYPES.has(fileType)) return "image";
  if (fileType?.startsWith("video/")) return "video";
  if (fileType?.startsWith("audio/")) return "audio";
  return "other";
}

export function AttachmentPreview({
  file,
  onLongPress,
  style,
}: {
  file: { name: string; hash: ContentAddress };
  onLongPress?(): void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const magicBytes = use(loadFileMagicBytes(file.hash));
  const fileType = filetypeinfo(magicBytes)[0]?.mime;
  const uri = use(getFileUri(file.hash));
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      return () => {
        URL.revokeObjectURL(uri);
      };
    }
  }, [uri]);

  const kind = getAttachmentKind(fileType);
  const isPreviewable = kind !== "other";

  return (
    <Fragment>
      <Pressable
        onPress={isPreviewable ? () => setIsPreviewOpen(true) : undefined}
        onLongPress={onLongPress}
        style={style}
      >
        {kind === "image" ? (
          <Image
            source={{ uri }}
            style={{ width: 100, height: 100 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              padding: 8,
              gap: 4,
              alignItems: "center",
            }}
          >
            <FontAwesome
              name={FILE_ICON_BY_KIND[kind]}
              size={24}
              color={theme.secondaryTextColor}
            />
            <View style={{ flexGrow: 1 }} />
            <Text
              style={[
                theme.secondaryTextStyle,
                { fontSize: 14, textAlign: "center" },
              ]}
            >
              {file.name}
            </Text>
          </View>
        )}
      </Pressable>
      {isPreviewable && (
        <Modal
          visible={isPreviewOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPreviewOpen(false)}
        >
          {isPreviewOpen && (
            <AttachmentPreviewModalContent
              uri={uri}
              name={file.name}
              kind={kind}
              onClose={() => setIsPreviewOpen(false)}
            />
          )}
        </Modal>
      )}
    </Fragment>
  );
}

const FILE_ICON_BY_KIND: Record<
  AttachmentKind,
  "file-video-o" | "file-audio-o" | "file"
> = {
  image: "file",
  video: "file-video-o",
  audio: "file-audio-o",
  other: "file",
};

function AttachmentPreviewModalContent({
  uri,
  name,
  kind,
  onClose,
}: {
  uri: string;
  name: string;
  kind: AttachmentKind;
  onClose(): void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {(() => {
        switch (kind) {
          case "image":
            return (
              <Image
                source={{ uri }}
                style={{ flex: 1 }}
                contentFit="contain"
              />
            );
          case "video":
            return <VideoAttachmentPreview uri={uri} />;
          case "audio":
            return <AudioAttachmentPreview uri={uri} name={name} />;
          case "other":
            return null;
        }
      })()}
      <Pressable
        onPress={onClose}
        style={{
          position: "absolute",
          top: insets.top + 8,
          right: 16,
          padding: 8,
        }}
      >
        <FontAwesome name="times" size={28} color="white" />
      </Pressable>
    </View>
  );
}

function VideoAttachmentPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.play();
  });
  return (
    <VideoView
      player={player}
      style={{ flex: 1 }}
      nativeControls
      contentFit="contain"
    />
  );
}

function AudioAttachmentPreview({ uri, name }: { uri: string; name: string }) {
  const theme = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <FontAwesome name="file-audio-o" size={64} color="white" />
      <Text style={{ color: "white", fontSize: 16 }}>{name}</Text>
      <Pressable
        onPress={() => {
          if (status.playing) player.pause();
          else player.play();
        }}
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: theme.linkTextColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome
          name={status.playing ? "pause" : "play"}
          size={28}
          color="white"
        />
      </Pressable>
    </View>
  );
}
