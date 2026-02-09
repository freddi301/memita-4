import { createContext, ReactNode, use, useState } from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "./Theme";

const RouterContext = createContext<RouteerContextProps>(null as any);

type RouteerContextProps = {
  currentScreen: React.ReactNode;
  setCurrentScreen(screen: React.ReactNode): void;
};

export function RouterProvider({ initial }: { initial: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<React.ReactNode>(initial);
  return (
    <RouterContext.Provider value={{ currentScreen, setCurrentScreen }}>
      {currentScreen}
    </RouterContext.Provider>
  );
}

export function useRouting() {
  const { setCurrentScreen } = use(RouterContext);
  return {
    changeScreen(screen: React.ReactNode) {
      setCurrentScreen(screen);
    },
  };
}

export function ScreenLink({
  to,
  label,
}: {
  to: ReactNode | (() => Promise<ReactNode>);
  label: string;
}) {
  const theme = useTheme();
  const { changeScreen } = useRouting();
  const [actionState, setActionState] = useState<"noop" | "loading">("noop");
  return (
    <Pressable
      onPress={() => {
        if (actionState === "loading") {
          return;
        }
        if (typeof to === "function") {
          setActionState("loading");
          to().then((screen) => {
            setActionState("noop");
            changeScreen(screen);
          });
        } else {
          changeScreen(to);
        }
      }}
      style={{
        padding: 16,
      }}
    >
      <Text
        style={
          actionState === "loading"
            ? { ...theme.secondaryTextStyle }
            : { ...theme.linkTextStyle }
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
