import {
  Camera,
  CameraRef,
  Location,
  MapView,
  MapViewRef,
  UserLocation,
} from "@maplibre/maplibre-react-native";
import * as ExpoLocation from "expo-location";
import { Fragment, useEffect, useRef, useState } from "react";
import { Pressable } from "react-native";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";

export function PlacesScreen({ accountId }: { accountId: string }) {
  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  useEffect(() => {
    ExpoLocation.requestForegroundPermissionsAsync();
  }, []);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [shouldFollow, setShouldFollow] = useState(true);
  return (
    <Fragment>
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
          backgroundColor: shouldFollow ? "blue" : "gray",
          width: 32,
          height: 32,
        }}
      />
      <MapView
        ref={mapRef}
        style={{ width: 300, height: 600 }}
        mapStyle={"https://tiles.openfreemap.org/styles/liberty"}
        attributionEnabled={false}
        compassEnabled
        localizeLabels
        pitchEnabled
      >
        <UserLocation
          visible
          showsUserHeadingIndicator
          onUpdate={(location) => {
            setUserLocation(location);
            if (shouldFollow) {
              cameraRef.current?.moveTo([
                location.coords.longitude,
                location.coords.latitude,
              ]);
            }
          }}
        />
        <Camera ref={cameraRef} />
      </MapView>
      <BottomTabNavigation accountId={accountId} />
    </Fragment>
  );
}
