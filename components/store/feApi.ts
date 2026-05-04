import { createContext } from "react";
import { AppStoredData } from "../storage/AppStorage";
import { QueuedStorageInterface } from "../storage/StorageInteraface";

export type MemitaQuery<Params, Return> = (
  p: Params,
) => (apiContext: FeApiContextType) => Promise<Return>;

export type MemitaMutation<Params> = (
  p: Params,
) => (apiContext: FeApiContextType) => Promise<void>;

type FeApiContextType = { appStorage: QueuedStorageInterface<AppStoredData> };

export const FeApiContext = createContext<FeApiContextType>(null as any);
