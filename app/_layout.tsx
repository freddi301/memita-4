import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../components/Theme";

export default function Layout() {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={{ flexGrow: 1, backgroundColor: theme.backgroundColor }}
    >
      <StatusBar translucent backgroundColor={theme.backgroundColor} />
      <Slot />
    </SafeAreaView>
  );
}
