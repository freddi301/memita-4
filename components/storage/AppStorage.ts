import { createContext } from "react";
import * as z from "zod";
import { DataItemSchema } from "../queries/Queries";
import { createQueuedStorage } from "./QueuedStorage";
import { QueuedStorageInterface, StorageInterface } from "./StorageInteraface";
import { StoredDeviceSettingsDataSchema } from "./storageSchema";
import { createTypedStorage } from "./TypedStorage";

export const AppStorageContext = createContext<
  QueuedStorageInterface<AppStoredData>
>(null as any);

const AppStoredDataSchema = z.object({
  deviceSettings: StoredDeviceSettingsDataSchema,
  data: z.array(DataItemSchema),
});

type AppStoredData = z.infer<typeof AppStoredDataSchema>;

export function createAppStorage({ storage }: { storage: StorageInterface }) {
  const typedStorage = createTypedStorage<AppStoredData>({
    storage,
    initial: { deviceSettings: { cryptoPrivateKeys: {} }, data: [] },
    encode: AppStoredDataSchema.parse,
    decode: AppStoredDataSchema.parse,
  });
  const queuedStorage = createQueuedStorage(typedStorage);
  return queuedStorage;
}
