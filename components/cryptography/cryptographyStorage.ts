import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AccountId,
  DeviceKeyPair,
  generateDeviceKeyPair,
} from "./cryptography";

// TODO cache in ram and validate saved device keys
// TODO maybe migration for app updates

const localStorageKey = "deviceKeyPairs";

async function loadDeviceKeyPairs(): Promise<Record<string, DeviceKeyPair>> {
  return JSON.parse((await AsyncStorage.getItem(localStorageKey)) ?? "{}");
}

async function saveDeviceKeyPairs(
  deviceKeyPairs: Record<string, DeviceKeyPair>,
): Promise<void> {
  await AsyncStorage.setItem(localStorageKey, JSON.stringify(deviceKeyPairs));
}

async function setDeviceKeyPair(
  accountId: AccountId,
  keyPair: DeviceKeyPair,
): Promise<void> {
  const deviceKeyPairs = await loadDeviceKeyPairs();
  deviceKeyPairs[accountId] = keyPair;
  await saveDeviceKeyPairs(deviceKeyPairs);
}

// void saveDeviceKeyPairs({});

export async function getDeviceKeyPair(
  accountId: AccountId,
): Promise<DeviceKeyPair> {
  const deviceKeyPairs = await loadDeviceKeyPairs();
  if (deviceKeyPairs[accountId]) {
    return deviceKeyPairs[accountId];
  } else {
    const newKeyPair = generateDeviceKeyPair();
    await setDeviceKeyPair(accountId, newKeyPair);
    return newKeyPair;
  }
}
