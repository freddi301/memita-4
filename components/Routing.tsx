import { createContext, ReactNode, Suspense, use, useState } from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "./Theme";

const RouterContext = createContext<RouterContextProps>(null as any);

type RouterContextProps = {
  navigate(screen: React.ReactNode): void;
  actionInProgress: boolean;
  setActionInProgress(inProgress: boolean): void;
};

export function RouterProvider({ initial }: { initial: React.ReactNode }) {
  const [screens, setScreens] = useState<Array<React.ReactNode>>([
    initial,
    initial,
  ]);
  const [actionInProgress, setActionInProgress] = useState(false);
  const navigate = (screen: React.ReactNode) => {
    setScreens((prev) => [prev[prev.length - 1], screen]);
  };
  return (
    <RouterContext.Provider
      value={{
        navigate,
        actionInProgress,
        setActionInProgress,
      }}
    >
      <Suspense fallback={screens[screens.length - 2]}>
        {screens[screens.length - 1]}
      </Suspense>
    </RouterContext.Provider>
  );
}

export function ScreenLink({
  to,
  label,
}: {
  to: ReactNode | (() => Promise<ReactNode> | Promise<void>);
  label: string;
}) {
  const theme = useTheme();
  const { actionInProgress, setActionInProgress, navigate } =
    use(RouterContext);
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
              navigate(screen);
            }
          });
        } else {
          navigate(to);
        }
      }}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 16,
        outline: "none",
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
