import "react-native-get-random-values";
// polifills first
import { setupI18n } from "@lingui/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { isEqual } from "lodash";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { patchFlatListProps } from "react-native-web-refresh-control";
import {
  registerForPushNotificationsAsync,
  triggerNotification,
} from "../components/notifications";
import { RouterRoot } from "../components/Routing";
import { SelectAccountScreen } from "../components/screens/SelectAccountScreen";
import { Memitai18n } from "./i18n/Memitai18n";
import { networkDummy } from "./network/netoworkDummy";
import { bareNetworkFactory } from "./network/networkBare";
import { websocketNetworkFactory } from "./network/networkWebsocketClient";
import {
  directMessagesList,
  directMessagesSummary,
} from "./queries/directMessages";
import { DataItem, DataItemSchema } from "./queries/Queries";
import { shouldSend } from "./queries/shouldSend";
import { AppStorageContext, createAppStorage } from "./storage/AppStorage";
import { StorageInterface } from "./storage/StorageInteraface";
import { createMemitaQueryClient } from "./store/dataApi";
import { DeviceSettingsProvider } from "./store/deviceSettingsStorage";
import { AppStoreContext, createStore } from "./store/store";
import { useTheme } from "./Theme";

patchFlatListProps();

export function createApp({ storage }: { storage: StorageInterface }) {
  const appStorage = createAppStorage({ storage });

  const queryClient = createMemitaQueryClient();

  const store = createStore<DataItem>({
    parse: DataItemSchema.parse,
    storage: {
      async add(item) {
        // TODO refactor somehow
        const didAdd = (await appStorage.read()).data.some((existingItem) =>
          isEqual(existingItem, item),
        );
        await appStorage.write((current) => {
          return { ...current, data: [...current.data, item] };
        });
        return didAdd;
      },
      async all() {
        return (await appStorage.read()).data;
      },
    },
    // networkFactory: websocketNetworkFactory,
    networkFactory:
      process.env.NODE_ENV === "test"
        ? networkDummy
        : Platform.OS === "web"
          ? websocketNetworkFactory
          : bareNetworkFactory,
    async onAdd(item) {
      // TODO make these more efficient and selective and come up with a thing to express that it is a live query at callsite
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [directMessagesList.name] }),
        queryClient.invalidateQueries({
          queryKey: [directMessagesSummary.name],
        }),
      ]);
      await triggerNotification();
    },
    shouldSend,
  });

  const i18n = setupI18n();

  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    const theme = useTheme();
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
        {children}
      </SafeAreaView>
    );
  };

  const Main = () => {
    useEffect(() => {
      void registerForPushNotificationsAsync();
    }, []);
    useEffect(() => {
      let isActive = true;
      const updateConnections = async () => {
        if (!isActive) return;
        await store.updateConnections(
          (await appStorage.read()).deviceSettings.cryptoPrivateKeys,
        );
        await updateConnections();
      };
      void updateConnections();
      return () => {
        isActive = false;
      };
    }, []);
    return (
      <AppStorageContext value={appStorage}>
        <AppStoreContext value={store}>
          <DeviceSettingsProvider>
            <QueryClientProvider client={queryClient}>
              <Memitai18n i18n={i18n}>
                <LayoutWrapper>
                  <RouterRoot initial={<SelectAccountScreen />} />
                </LayoutWrapper>
              </Memitai18n>
            </QueryClientProvider>
          </DeviceSettingsProvider>
        </AppStoreContext>
      </AppStorageContext>
    );
  };
  return { Main };
}
