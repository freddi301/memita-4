import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
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

  function renderStringNode(node: React.ReactNode, style: object) {
    return typeof node === "string" ? (
      <Text style={[theme.textStyle, style]}>{node}</Text>
    ) : (
      node
    );
  }

  return (
    <View
      style={[
        {
          position: "relative",
          flexGrow: flexGrow1 ? 1 : undefined,
          borderWidth: 1,
          borderColor: theme.separatorColor,
          borderRadius: 4,
        },
      ]}
    >
      <Pressable onPress={() => setIsOpen((open) => !open)}>
        {renderStringNode(renderValue(value), {
          paddingHorizontal: 8,
          paddingBottom: 4,
          paddingTop: 6,
        })}
      </Pressable>
      <Modal visible={isOpen} transparent animationType="fade">
        <Pressable
          style={[
            {
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
              backgroundColor: theme.overlayBackgroundColor,
            },
          ]}
          onPress={() => setIsOpen(false)}
        >
          <ScrollView
            style={[
              {
                backgroundColor: theme.backgroundColor,
                borderRadius: 8,
                minWidth: 200,
                margin: 16,
              },
            ]}
          >
            {options.map((option, index) => {
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                >
                  {renderStringNode(renderOption(option), {
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  })}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Modal>
    </View>
  );
}
