import { FontAwesome } from "@expo/vector-icons";
import { createContext, ReactNode, Suspense, use, useState } from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "./Theme";

const RouterContext = createContext<RouterContextProps>(null as any);

type RouterContextProps = {
  navigate(screen: ReactNode): void;
  targetScreen: ReactNode;
  actionInProgress: boolean;
  setActionInProgress(inProgress: boolean): void;
};

export function RouterProvider({ initial }: { initial: ReactNode }) {
  const [screens, setScreens] = useState<Array<ReactNode>>([initial, initial]);
  const [actionInProgress, setActionInProgress] = useState(false);
  const navigate = (screen: ReactNode) => {
    setScreens((prev) => [prev[prev.length - 1], screen]);
  };
  return (
    <RouterContext.Provider
      value={{
        navigate,
        targetScreen: screens[screens.length - 1],
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

type IconName = keyof typeof FontAwesome.glyphMap;

export function ScreenLink({
  to,
  label,
  icon,
  hideLabel,
}: {
  to: ReactNode | (() => Promise<ReactNode | void>);
  label: string;
  icon?: IconName;
  hideLabel?: boolean;
}) {
  const theme = useTheme();
  const { actionInProgress, setActionInProgress, navigate, targetScreen } =
    use(RouterContext);
  const [isPressing, setIsPressing] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);
  const textColor = isPerforming
    ? theme.linkTextColor
    : actionInProgress || !to
    ? theme.secondaryTextColor
    : theme.linkTextColor;
  const navigationTriggereFromHere =
    typeof to !== "function" ? compareScreens(targetScreen, to) : false;
  return (
    <Pressable
      onPress={() => {
        if (actionInProgress || !to) {
          return;
        }
        if (typeof to === "function") {
          setIsPerforming(true);
          setActionInProgress(true);
          to().then((screen) => {
            setActionInProgress(false);
            setIsPerforming(false);
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
        backgroundColor: navigationTriggereFromHere
          ? theme.activeActionBackgroundColor
          : isPerforming
          ? theme.activeActionBackgroundColor
          : isPressing && to
          ? theme.pressedBackgroundColor
          : theme.backgroundColor,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
      }}
      onPressIn={() => {
        setIsPressing(true);
      }}
      onPressOut={() => {
        setIsPressing(false);
      }}
    >
      {icon ? <FontAwesome name={icon} color={textColor} size={16} /> : null}
      {!hideLabel ? (
        <Text style={{ ...theme.linkTextStyle, color: textColor }}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

function compareScreens(left: ReactNode, right: ReactNode): boolean {
  if (
    typeof left === "object" &&
    left !== null &&
    "type" in left &&
    typeof right === "object" &&
    right !== null &&
    "type" in right
  ) {
    // TODO compare props too
    return left.type === right.type;
  }
  return false;
}
