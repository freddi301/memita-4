import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";

export function DateTimeInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange(value: number | undefined): void;
}) {
  const theme = useTheme();
  const { translate } = useTranslate();

  const [show, setShow] = useState<"date" | "time" | false>(false);

  const showPicker = (mode: "date" | "time") => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode,
        value: value ? new Date(value) : new Date(),
        onChange(event, date) {
          if (event.type === "set") {
            onChange(date?.getTime());
          }
        },
      });
    } else {
      setShow(mode);
    }
  };

  if (Platform.OS === "web") {
    return (
      <input
        type="datetime-local"
        style={{
          ...theme.textInputStyle,
          flexGrow: 1,
          marginRight: 16,
          marginLeft: 16,
        }}
        value={value ? new Date(value).toISOString().slice(0, 16) : ""}
        onChange={(event) => {
          onChange(
            event.currentTarget.value
              ? new Date(event.currentTarget.value).getTime()
              : undefined,
          );
        }}
      />
    );
  }

  return (
    <View style={{ flexDirection: "row" }}>
      <TextInput
        style={{ ...theme.textInputStyle, flexGrow: 1, marginHorizontal: 16 }}
        value={value ? new Date(value).toLocaleString() : ""}
        readOnly
      />
      <ScreenLink
        to={async () => {
          showPicker("date");
        }}
        icon="calendar"
        hideLabel
        label={translate({
          en: "Edit date",
          it: "Modifica data",
        })}
      />
      <ScreenLink
        to={async () => {
          showPicker("time");
        }}
        icon="clock-o"
        hideLabel
        label={translate({
          en: "Edit time",
          it: "Modifica ora",
        })}
      />
      <ScreenLink
        to={async () => {
          onChange(undefined);
        }}
        icon="close"
        hideLabel
        label={translate({
          en: "Clear date",
          it: "Cancella data",
        })}
      />
      {show && (
        <DateTimePicker
          mode="datetime"
          value={value ? new Date(value) : new Date()}
          onChange={(_, date) => {
            onChange(date?.getTime());
            setShow(false);
          }}
        />
      )}
    </View>
  );
}
