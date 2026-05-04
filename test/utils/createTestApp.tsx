import { createApp } from "../../components/Main";
import { createMemoryStorage } from "../../components/storage/MemoryStorage";

export async function createTestApp() {
  const { Main, api } = createApp({ storage: createMemoryStorage() });
  return { Main, api };
}
