import { ed25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import * as z from "zod";

export const DeviceIdSchema = z.string().brand("DeviceId");
/** ED25519 Public key, hex string */
export type DeviceId = z.infer<typeof DeviceIdSchema>;

export const DeviceSecretSchema = z.string().brand("DeviceSecret");
/** ED25519 Secret key, hex string */
export type DeviceSecret = z.infer<typeof DeviceSecretSchema>;

export function deviceIdToUint8Array(deviceId: DeviceId): Uint8Array {
  return hexToBytes(deviceId);
}
export function deviceIdFromUint8Array(uint8Array: Uint8Array): DeviceId {
  if (uint8Array.length !== 32) {
    throw new Error(`Invalid deviceId length: ${uint8Array.length}`);
  }
  return DeviceIdSchema.parse(bytesToHex(uint8Array));
}

export function deviceSecretToUint8Array(
  deviceSecret: DeviceSecret,
): Uint8Array {
  return hexToBytes(deviceSecret);
}

export function deviceSecretFromUint8Array(
  uint8Array: Uint8Array,
): DeviceSecret {
  if (uint8Array.length !== 32) {
    throw new Error(`Invalid deviceSecret length: ${uint8Array.length}`);
  }
  return DeviceSecretSchema.parse(bytesToHex(uint8Array));
}

export type DeviceKeyPair = { deviceId: DeviceId; deviceSecret: DeviceSecret };
export function generateDeviceKeyPair(): DeviceKeyPair {
  const { secretKey, publicKey } = generateED25519KeyPair();
  return {
    deviceId: deviceIdFromUint8Array(publicKey),
    deviceSecret: deviceSecretFromUint8Array(secretKey),
  };
}

export const AccountIdSchema = z.string().brand("AccountId");
/** ED25519 Public key, hex string */
export type AccountId = z.infer<typeof AccountIdSchema>;

export const AccountSecretSchema = z.string().brand("AccountSecret");
/** ED25519 Secret key, hex string */
export type AccountSecret = z.infer<typeof AccountSecretSchema>;

export function accountIdFromUint8Array(uint8Array: Uint8Array): AccountId {
  if (uint8Array.length !== 32) {
    throw new Error(`Invalid accountId length: ${uint8Array.length}`);
  }
  return AccountIdSchema.parse(bytesToHex(uint8Array));
}
export function accountSecretFromUint8Array(
  uint8Array: Uint8Array,
): AccountSecret {
  if (uint8Array.length !== 32) {
    throw new Error(`Invalid accountSecret length: ${uint8Array.length}`);
  }
  return AccountSecretSchema.parse(bytesToHex(uint8Array));
}
export function accountIdFromString(string: string): AccountId | undefined {
  try {
    return accountIdFromUint8Array(hexToBytes(string));
  } catch {
    return undefined;
  }
}

export type AccountKeyPair = {
  accountId: AccountId;
  accountSecret: AccountSecret;
};
export function generateAccountKeyPair(): AccountKeyPair {
  const { secretKey, publicKey } = generateED25519KeyPair();
  return {
    accountId: accountIdFromUint8Array(publicKey),
    accountSecret: accountSecretFromUint8Array(secretKey),
  };
}

function generateED25519KeyPair() {
  const secretKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(secretKey);
  return { secretKey, publicKey };
}
