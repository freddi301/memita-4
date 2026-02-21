import { Fragment } from "react";
import { View } from "react-native";
import { BottomTabNavigation } from "../ui/BottomTabNavigation";
import { GeoMap } from "../ui/GeoMap";

export function PlacesScreen({ accountId }: { accountId: string }) {
  return (
    <Fragment>
      <View style={{ flexGrow: 1 }}>
        <GeoMap accountId={accountId} />
      </View>
      <BottomTabNavigation accountId={accountId} />
    </Fragment>
  );
}
