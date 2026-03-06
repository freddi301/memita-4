import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

const identifier = "memita_has_something_for_you";

export async function triggerNotification() {
  if (Platform.OS !== "web") {
    const presented = await Notifications.getPresentedNotificationsAsync();
    const alreadyPresent = presented.some(
      (notification) => notification.request.identifier === identifier
    );
    if (!alreadyPresent) {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: "Memita",
        },
        trigger: null,
      });
    }
  }
}

async function registerForPushNotificationsAsync() {
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    await Notifications.requestPermissionsAsync();
  }
}

registerForPushNotificationsAsync();
