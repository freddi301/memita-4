import { View } from "react-native";
import { useTheme } from "../Theme";

export function ListSeparator() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.separatorColor,
      }}
    />
  );
}
