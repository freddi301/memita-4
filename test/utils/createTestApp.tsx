import { act } from "@testing-library/react-native";
import { createApp } from "../../components/Main";
import { createMemoryStorage } from "../../components/storage/MemoryStorage";

const teardownRegistry: Record<string, Promise<void>> = {};

const getTestName = () => expect.getState().currentTestName ?? "";

export async function createTestApp() {
  const { Main, api } = createApp({ storage: createMemoryStorage() });
  teardownRegistry[getTestName()] = api.store.stop();
  return { Main, api };
}

afterEach(async () => {
  await act(async () => {
    await teardownRegistry[getTestName()];
    delete teardownRegistry[getTestName()];
  });
});
