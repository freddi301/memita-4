import { FontAwesome } from "@expo/vector-icons";
import { isEqual } from "lodash";
import {
  Activity,
  createContext,
  Fragment,
  ReactNode,
  use,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Pressable, StyleProp, Text, ViewStyle } from "react-native";
import { useTheme } from "./Theme";

const MAX_ALIVE_SCREENS = 15;

type RouterContextType = {
  current: ScreenEntry;
  onChange(to: ReactNode): void;
  isPending: boolean;
  startTransition(callback: (() => void) | (() => Promise<void>)): void;
};

type ScreenEntry = { key: string; forceSuspend: string; element: ReactNode };

const RouterContext = createContext<RouterContextType>(null as any);

export function RouterRoot({ initial }: { initial: ReactNode }) {
  const [state, setState] = useState<{
    nextScreenKey: number;
    nextForceSuspend: number;
    screens: Array<ScreenEntry>;
  }>({
    nextScreenKey: 1,
    nextForceSuspend: 1,
    screens: [{ key: "0", forceSuspend: "0", element: initial }],
  });
  const [isPending, startTransition] = useTransition();
  const onChange = useCallback((to: ReactNode) => {
    setState((state) => {
      const existing = state.screens.find((screen) =>
        compareScreens(screen.element, to),
      );
      if (existing) {
        return {
          nextScreenKey: state.nextScreenKey,
          nextForceSuspend: state.nextForceSuspend + 1,
          screens: [
            {
              key: existing.key,
              forceSuspend: String(state.nextForceSuspend),
              element: existing.element,
            },
            ...state.screens.filter((screen) => screen.key !== existing.key),
          ],
        };
      }
      return {
        nextScreenKey: state.nextScreenKey + 1,
        nextForceSuspend: state.nextForceSuspend + 1,
        screens: [
          {
            key: String(state.nextScreenKey),
            forceSuspend: String(state.nextForceSuspend),
            element: to,
          },
          ...state.screens.slice(0, MAX_ALIVE_SCREENS),
        ],
      };
    });
  }, []);
  const current = state.screens[0]!;
  const value = useMemo(
    () => ({ current, onChange, isPending, startTransition }),
    [onChange, isPending, current],
  );
  return (
    <RouterContext value={value}>
      {state.screens.map((screen) => {
        return (
          <Activity
            key={screen.key}
            mode={screen.key === current.key ? "visible" : "hidden"}
          >
            {screen.element}
          </Activity>
        );
      })}
    </RouterContext>
  );
}

export function useCurrentScreenForceSuspend() {
  return use(RouterContext)?.current.forceSuspend;
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

type IconName = keyof typeof FontAwesome.glyphMap;

export function ScreenLink({
  to,
  label,
  icon,
  color,
  hideLabel,
  children,
  styleOverride,
}: {
  to: ReactNode | (() => Promise<ReactNode | void>);
  color?: string;
  styleOverride?: StyleProp<ViewStyle>;
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
  const { current, onChange, isPending, startTransition } = use(RouterContext);
  const [isPressing, setIsPressing] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);
  const textColor =
    isPending || !to
      ? theme.secondaryTextColor
      : (color ?? theme.linkTextColor);
  const isCurrentScreen =
    typeof to !== "function" ? compareScreens(to, current.element) : false;
  const backgroundColor =
    isPerforming || isCurrentScreen
      ? theme.activeActionBackgroundColor
      : isPressing && to
        ? theme.pressedBackgroundColor
        : theme.backgroundColor;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (isPending || !to) {
          return;
        }
        if (typeof to === "function") {
          setIsPerforming(true);
          startTransition(async () => {
            const result = await to();
            if (result) onChange(result);
            setIsPerforming(false);
          });
        } else {
          startTransition(async () => {
            onChange(to);
          });
        }
      }}
      style={
        children
          ? { backgroundColor, ...styleOverride }
          : {
              paddingVertical: 8,
              paddingHorizontal: 16,
              // @ts-ignore
              outline: "none",
              backgroundColor,
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              minHeight: 36,
              ...styleOverride,
            }
      }
      onPressIn={() => {
        setIsPressing(true);
      }}
      onPressOut={() => {
        setIsPressing(false);
      }}
    >
      {children ? (
        children
      ) : (
        <Fragment>
          {icon && <FontAwesome name={icon} color={textColor} size={16} />}
          {!hideLabel && (
            <Text
              style={{
                ...theme.linkTextStyle,
                color: textColor,
                paddingTop: 2,
              }}
            >
              {label}
            </Text>
          )}
        </Fragment>
      )}
    </Pressable>
  );
}
