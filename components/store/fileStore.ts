import { blake3 } from "@noble/hashes/blake3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { Directory, File, Paths } from "expo-file-system";
import * as z from "zod";

export const ContentAddressSchema = z.string().brand("ContentAddress");
export type ContentAddress = z.infer<typeof ContentAddressSchema>;

// TODO this is naive and sync, will need proper mangment on async writes and reads

export async function storeFile(data: Uint8Array): Promise<ContentAddress> {
  const hash = bytesToHex(blake3(data, { dkLen: 32 }));
  const file = new File(Paths.document, hash);
  if (!file.exists) file.create();
  file.write(data);
  return ContentAddressSchema.parse(hash);
}

async function doGetFileUri(address: ContentAddress): Promise<string> {
  const file = new File(Paths.document, address);
  if (!file.exists) throw new Error("File not found: " + address);
  return file.uri;
}
export const getFileUri = naiveMemoize(doGetFileUri);

async function doLoadFileMagicBytes(
  address: ContentAddress,
): Promise<Uint8Array> {
  const file = new File(Paths.document, address);
  if (!file.exists) throw new Error("File not found: " + address);
  const handle = file.open();
  const magicBytes = handle.readBytes(16);
  return magicBytes;
}
export const loadFileMagicBytes = naiveMemoize(doLoadFileMagicBytes);

// export function loadFile(address: ContentAddress): Uint8Array {
//   const file = new File(Paths.document, address);
//   if (!file.exists) throw new Error("File not found: " + address);
//   return file.bytesSync();
// }

export async function deleteAllFiles(): Promise<void> {
  const dir = new Directory(Paths.document);
  for (const item of dir.list()) {
    item.delete();
  }
}

function naiveMemoize<A extends string, R>(callback: (arg: A) => R) {
  const cache = new Map<A, R>();
  return (arg: A) => {
    if (cache.has(arg)) return cache.get(arg)!;
    const result = callback(arg);
    cache.set(arg, result);
    return result;
  };
}
