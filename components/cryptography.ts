import "react-native-get-random-values";
// polifills first
import { ed25519 } from "@noble/curves/ed25519.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import AsyncStorage from "@react-native-async-storage/async-storage";

type KeyPair = { publicKey: string; secretKey: string };

export function generateKeyPair(): KeyPair {
  const secretKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(secretKey);
  return { secretKey: bytesToHex(secretKey), publicKey: bytesToHex(publicKey) };
}

// TODO cache in ram and validate saved device keys
// TODO maybe migration for app updates

const localStorageKey = "deviceKeyPairs";

async function loadDeviceKeyPairs(): Promise<Record<string, KeyPair>> {
  return JSON.parse((await AsyncStorage.getItem(localStorageKey)) ?? "{}");
}

async function saveDeviceKeyPairs(
  deviceKeyPairs: Record<string, KeyPair>,
): Promise<void> {
  await AsyncStorage.setItem(localStorageKey, JSON.stringify(deviceKeyPairs));
}

async function setDeviceKeyPair(
  accountId: string,
  keyPair: KeyPair,
): Promise<void> {
  const deviceKeyPairs = await loadDeviceKeyPairs();
  deviceKeyPairs[accountId] = keyPair;
  await saveDeviceKeyPairs(deviceKeyPairs);
}

// saveDeviceKeyPairs({});

export async function getDeviceKeyPair(accountId: string): Promise<KeyPair> {
  const deviceKeyPairs = await loadDeviceKeyPairs();
  if (deviceKeyPairs[accountId]) {
    return deviceKeyPairs[accountId];
  } else {
    const newKeyPair = generateKeyPair();
    await setDeviceKeyPair(accountId, newKeyPair);
    return newKeyPair;
  }
}
