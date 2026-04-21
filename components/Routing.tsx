import { FontAwesome } from "@expo/vector-icons";
import { isEqual } from "lodash";
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
  children,
  styleOverride: { flexGrow1 = false, hasPadding = true } = {},
}: {
  to: ReactNode | (() => Promise<ReactNode | void>);
  styleOverride?: {
    flexGrow1?: boolean;
    hasPadding?: boolean;
  };
} & (
  | {
      label: string;
      icon?: IconName;
      hideLabel?: boolean;
      children?: undefined;
    }
  | {
      label?: undefined;
      icon?: undefined;
      hideLabel?: undefined;
      children: ReactNode;
    }
)) {
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
  const shouldHavePadding = children ? false : hasPadding;
  const shouldShowLabel = children ? false : !hideLabel;
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
        paddingVertical: shouldHavePadding ? 8 : 0,
        paddingHorizontal: shouldHavePadding ? 16 : 0,
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
        flexGrow: flexGrow1 ? 1 : undefined,
      }}
      onPressIn={() => {
        setIsPressing(true);
      }}
      onPressOut={() => {
        setIsPressing(false);
      }}
    >
      {icon ? <FontAwesome name={icon} color={textColor} size={16} /> : null}
      {shouldShowLabel ? (
        <Text style={{ ...theme.linkTextStyle, color: textColor }}>
          {label}
        </Text>
      ) : null}
      {children}
    </Pressable>
  );
}

function compareScreens(left: ReactNode, right: ReactNode): boolean {
  if (
    typeof left === "object" &&
    left !== null &&
    "type" in left &&
    typeof left.type === "function" &&
    typeof right === "object" &&
    right !== null &&
    "type" in right &&
    typeof right.type === "function"
  ) {
    return (
      left.type.name === right.type.name && isEqual(left.props, right.props)
    );
  }
  return false;
}
