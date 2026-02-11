import { useColorScheme } from "react-native";

const darkTheme = {
  backgroundColor: "#1d1d1d",
  textColor: "#e9e9e9",
  separatorColor: "#4a4a4a",
  secondaryTextColor: "#939393",
  linkTextColor: "#60a0ff",
  pressedBackgroundColor: "#2a2a2a",
  activeActionBackgroundColor: "#1a2332",
};

type ThemeProps = typeof darkTheme;

const lightTheme: ThemeProps = {
  backgroundColor: "#e8e8e8",
  textColor: "#191919",
  separatorColor: "#cecece",
  secondaryTextColor: "#838383",
  linkTextColor: "#2d74df",
  pressedBackgroundColor: "#d0d0d0",
  activeActionBackgroundColor: "#9bb7e2",
};

export function useTheme() {
  const colorScheme = useColorScheme();
  const themeProps = colorScheme === "light" ? lightTheme : darkTheme;
  const textStyle = {
    color: themeProps.textColor,
    fontFamliy: "sans-serif",
    fontSize: 16,
  };
  return {
    ...themeProps,
    textStyle: {
      color: themeProps.textColor,
      fontFamliy: "sans-serif",
      fontSize: 16,
    },
    secondaryTextStyle: {
      ...textStyle,
      color: themeProps.secondaryTextColor,
    },
    linkTextStyle: {
      ...textStyle,
      color: themeProps.linkTextColor,
    },
    textInputStyle: {
      ...textStyle,
      borderColor: themeProps.linkTextColor,
      borderBottomWidth: 1,
      outline: "none" as const,
      padding: 0,
    },
  };
}
