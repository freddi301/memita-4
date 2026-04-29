import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../Theme";

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
        borderRadius: 4,
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
      <Modal visible={isOpen} transparent animationType="fade">
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            backgroundColor: "#000000cc",
          }}
        >
          <View
            style={{
              backgroundColor: theme.backgroundColor,
              borderRadius: 8,
              minWidth: 200,
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
                        paddingHorizontal: 16,
                        paddingVertical: 8,
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
        </View>
      </Modal>
    </View>
  );
}
