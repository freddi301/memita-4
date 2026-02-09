import { useColorScheme } from "react-native";

const darkTheme = {
  textColor: "#eeeeee",
  separatorColor: "#999999",
  secondaryTextColor: "#aaaaaa",
  linkTextColor: "#60a0ff",
};

type ThemeProps = typeof darkTheme;

const lightTheme: ThemeProps = {
  textColor: "#111111",
  separatorColor: "#999999",
  secondaryTextColor: "#aaaaaa",
  linkTextColor: "#60a0ff",
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
  };
}
