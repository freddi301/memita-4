import { Slot } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../components/Theme";

export default function Layout() {
  const theme = useTheme();
  return (
    <View style={{ flexGrow: 1, backgroundColor: theme.backgroundColor }}>
      {/* <StatusBar translucent backgroundColor={theme.backgroundColor} /> */}
      <SafeAreaView style={{ flexGrow: 1 }}>
        <Slot />
      </SafeAreaView>
    </View>
  );
}
