import { FontAwesome } from "@expo/vector-icons";
import filetypeinfo from "magic-bytes.js";
import { use, useEffect } from "react";
import { Image, Platform, Text, View } from "react-native";
import { useTheme } from "../Theme";
import {
  ContentAddress,
  getFileUri,
  loadFileMagicBytes,
} from "../store/fileStore";

// TODO show file size and type
// TODO refactor this to own component and support more file types

export function AttachmentPreview({
  file,
}: {
  file: { name: string; hash: ContentAddress };
}) {
  const theme = useTheme();
  const magicBytes = use(loadFileMagicBytes(file.hash));
  const fileType = filetypeinfo(magicBytes)[0]?.mime;
  const uri = use(getFileUri(file.hash));
  console.log(uri);
  useEffect(() => {
    if (Platform.OS === "web") {
      return () => {
        URL.revokeObjectURL(uri);
      };
    }
  }, [uri]);
  switch (fileType) {
    case "image/jpeg":
    case "image/png":
    case "image/gif": {
      return <Image source={{ uri }} style={{ width: 100, height: 100 }} />;
    }
    default:
      return (
        <View
          style={{
            width: 100,
            height: 100,
            padding: 8,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.separatorColor,
            gap: 4,
            alignItems: "center",
          }}
        >
          <FontAwesome name="file" size={24} color={theme.secondaryTextColor} />
          <View style={{ flexGrow: 1 }} />
          <Text
            style={{
              ...theme.textStyle,
              color: theme.secondaryTextColor,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {file.name}
          </Text>
        </View>
      );
  }
}
