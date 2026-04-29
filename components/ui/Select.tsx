import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../Theme";

// TODO fix dropdown not visible is there are successive items

export function Select<T = string>({
  options,
  value,
  onChange,
  renderValue = (value) => String(value),
  renderOption = renderValue,
  styleOverrides: { flexGrow1 = false } = {},
}: {
  options: Array<T>;
  value: T;
  onChange(value: T): void;
  renderValue?(value: T): React.ReactNode;
  renderOption?(option: T): React.ReactNode;
  styleOverrides?: { flexGrow1?: boolean };
}) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View
      style={{
        position: "relative",
        flexGrow: flexGrow1 ? 1 : undefined,
        borderWidth: 1,
        borderColor: theme.separatorColor,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: isOpen ? 0 : 4,
        borderBottomRightRadius: isOpen ? 0 : 4,
      }}
    >
      <Pressable onPress={() => setIsOpen((open) => !open)}>
        {(() => {
          const renderedValue = renderValue(value);
          return typeof renderedValue === "string" ? (
            <Text
              style={{
                ...theme.textStyle,
                paddingHorizontal: 8,
                paddingBottom: 4,
                paddingTop: 6,
              }}
            >
              {renderedValue}
            </Text>
          ) : (
            renderedValue
          );
        })()}
      </Pressable>
      {isOpen && (
        <View
          style={{
            position: "absolute",
            top: "100%",
            width: "100%",
            backgroundColor: theme.backgroundBackColor,
            borderColor: theme.separatorColor,
            borderWidth: 1,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
          }}
        >
          {options.map((option, index) => {
            const renderedOption = renderOption(option);
            return (
              <Pressable
                key={index}
                onPress={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                {typeof renderedOption === "string" ? (
                  <Text
                    style={{
                      ...theme.textStyle,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    {renderedOption}
                  </Text>
                ) : (
                  renderedOption
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
