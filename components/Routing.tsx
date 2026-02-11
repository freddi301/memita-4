import {
  createContext,
  ReactNode,
  startTransition,
  use,
  useState,
} from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "./Theme";

const RouterContext = createContext<RouterContextProps>(null as any);

type RouterContextProps = {
  currentScreen: React.ReactNode;
  setCurrentScreen(screen: React.ReactNode): void;
  actionInProgress: boolean;
  setActionInProgress(inProgress: boolean): void;
};

export function RouterProvider({ initial }: { initial: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<React.ReactNode>(initial);
  const [actionInProgress, setActionInProgress] = useState(false);
  return (
    <RouterContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        actionInProgress,
        setActionInProgress,
      }}
    >
      {currentScreen}
    </RouterContext.Provider>
  );
}

export function useRouting() {
  const { setCurrentScreen, actionInProgress } = use(RouterContext);
  return {
    changeScreen(screen: React.ReactNode) {
      startTransition(() => {
        setCurrentScreen(screen);
      });
    },
    actionInProgress,
  };
}

export function ScreenLink({
  to,
  label,
}: {
  to: ReactNode | (() => Promise<ReactNode> | Promise<void>);
  label: string;
}) {
  const theme = useTheme();
  const { changeScreen } = useRouting();
  const { actionInProgress, setActionInProgress } = use(RouterContext);
  return (
    <Pressable
      onPress={() => {
        if (actionInProgress) {
          return;
        }
        if (typeof to === "function") {
          setActionInProgress(true);
          to().then((screen) => {
            setActionInProgress(false);
            if (screen) {
              changeScreen(screen);
            }
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
          actionInProgress
            ? { ...theme.secondaryTextStyle }
            : { ...theme.linkTextStyle }
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
