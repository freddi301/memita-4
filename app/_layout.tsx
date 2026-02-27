import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../components/Theme";

export default function Layout() {
  const theme = useTheme();
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.backgroundColor }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Slot />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
