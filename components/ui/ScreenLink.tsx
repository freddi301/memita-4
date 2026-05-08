import { FontAwesome } from "@expo/vector-icons";
import { Fragment, ReactNode, useState } from "react";
import { Pressable, StyleProp, Text, ViewStyle } from "react-native";
import { useRouterContext } from "../Routing";
import { useTheme } from "../Theme";

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
  const { isPending, navigate } = useRouterContext();
  const [isPressing, setIsPressing] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);
  const textColor =
    isPending || !to
      ? theme.secondaryTextColor
      : (color ?? theme.linkTextColor);
  const backgroundColor = isPerforming
    ? theme.activeActionBackgroundColor
    : isPressing && to
      ? theme.pressedBackgroundColor
      : theme.backgroundColor;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (isPending || !to || isPerforming) {
          return;
        }
        setIsPerforming(true);
        navigate({
          to,
          onDone() {
            setIsPerforming(false);
          },
        });
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
