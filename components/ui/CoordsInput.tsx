import { Fragment, useState } from "react";
import { Dimensions, TextInput, View } from "react-native";
import { ScreenLink } from "../Routing";
import { useTheme } from "../Theme";
import { useTranslate } from "../Translate";
import { GeoMap } from "./GeoMap";

export function CoordsInput({
  value,
  onChange,
}: {
  value: { latitude: number; longitude: number } | undefined;
  onChange(value: { latitude: number; longitude: number } | undefined): void;
}) {
  const theme = useTheme();
  const { translate } = useTranslate();

  const [showMap, setShowMap] = useState(false);

  return (
    <Fragment>
      <View style={{ flexDirection: "row" }}>
        <TextInput
          value={value?.latitude.toString() ?? ""}
          style={{
            ...theme.textInputStyle,
            flex: 1,
            marginRight: 8,
            marginLeft: 16,
          }}
        />
        <TextInput
          value={value?.longitude.toString() ?? ""}
          style={{ ...theme.textInputStyle, flex: 1 }}
        />
        <ScreenLink
          to={async () => {
            setShowMap(!showMap);
          }}
          icon="map"
          hideLabel
          label={translate({
            en: "Show on map",
            it: "Mostra sulla mappa",
          })}
        />
      </View>
      {showMap && (
        <View
          style={{
            width: Dimensions.get("screen").width,
            height: Dimensions.get("screen").width,
          }}
        >
          <GeoMap currentLocation={value} onSetLocation={onChange} />
        </View>
      )}
    </Fragment>
  );
}
