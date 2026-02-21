import { FontAwesome } from "@expo/vector-icons";
import {
  Camera,
  CameraRef,
  Location,
  MapView,
  MapViewRef,
  UserLocation,
} from "@maplibre/maplibre-react-native";
import * as ExpoLocation from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../Theme";

export function GeoMap({ accountId }: { accountId: string }) {
  const theme = useTheme();

  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  useEffect(() => {
    ExpoLocation.requestForegroundPermissionsAsync();
  }, []);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [shouldFollow, setShouldFollow] = useState(true);
  return (
    <View style={{ flexGrow: 1, position: "relative" }}>
      <MapView
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          bottom: 0,
          right: 0,
        }}
        mapStyle={"https://tiles.openfreemap.org/styles/liberty"}
        attributionEnabled={false}
        compassEnabled
        localizeLabels
        pitchEnabled
        onRegionDidChange={(payload) => {
          if (payload.properties.isUserInteraction) {
            setShouldFollow(false);
          }
        }}
      >
        <UserLocation
          visible
          showsUserHeadingIndicator
          onUpdate={(location) => {
            setUserLocation(location);
            if (shouldFollow) {
              cameraRef.current?.moveTo(
                [location.coords.longitude, location.coords.latitude],
                1000
              );
            }
          }}
        />
        <Camera ref={cameraRef} />
      </MapView>
      <Pressable
        onPress={() => {
          if (shouldFollow) {
            setShouldFollow(false);
          } else {
            setShouldFollow(true);
            if (userLocation) {
              cameraRef.current?.moveTo(
                [userLocation.coords.longitude, userLocation.coords.latitude],
                1000
              );
              cameraRef.current?.zoomTo(14, 1000);
            }
          }
        }}
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          width: 32,
          height: 32,
          backgroundColor: theme.backgroundColor,
          borderRadius: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome
          name="crosshairs"
          size={32}
          color={shouldFollow ? theme.linkTextColor : theme.secondaryTextColor}
        />
      </Pressable>
    </View>
  );
}
