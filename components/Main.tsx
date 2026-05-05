import "react-native-get-random-values";
// polifills first
import { setupI18n } from "@lingui/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { isEqual } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { patchFlatListProps } from "react-native-web-refresh-control";
import {
  registerForPushNotificationsAsync,
  triggerNotification,
} from "../components/notifications";
import { RouterRoot } from "../components/Routing";
import { SelectAccountScreen } from "../components/screens/SelectAccountScreen";
import { accountIdFromString } from "./cryptography/cryptography";
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
import { ProfileDeepLinkScreen } from "./screens/ProfileDeepLinkScreen";
import { createAppStorage } from "./storage/AppStorage";
import { StorageInterface } from "./storage/StorageInteraface";
import { createMemitaQueryClient } from "./store/dataApi";
import { FeApiContext } from "./store/feApi";
import { createStore } from "./store/store";
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

  const api = { appStorage };

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
      // TODO reactivate
      // void updateConnections();
      return () => {
        isActive = false;
      };
    }, []);

    const { contactId } = useLocalSearchParams();
    const validContactId = useMemo(() => {
      if (typeof contactId !== "string") return;
      try {
        return accountIdFromString(contactId);
      } catch {
        return;
      }
    }, [contactId]);
    const [ignoreOverride, setIgnoreOverride] = useState(false);
    useEffect(() => {
      if (validContactId) setIgnoreOverride(false);
    }, [validContactId]);

    return (
      <FeApiContext value={api}>
        <QueryClientProvider client={queryClient}>
          <Memitai18n i18n={i18n}>
            <LayoutWrapper>
              <RouterRoot
                initial={<SelectAccountScreen />}
                overrideScreen={
                  validContactId && !ignoreOverride ? (
                    <ProfileDeepLinkScreen
                      contactId={validContactId}
                      onDone={() => {
                        setIgnoreOverride(true);
                      }}
                    />
                  ) : null
                }
              />
            </LayoutWrapper>
          </Memitai18n>
        </QueryClientProvider>
      </FeApiContext>
    );
  };
  return { Main, api };
}
