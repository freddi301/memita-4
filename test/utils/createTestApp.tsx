import { render } from "@testing-library/react-native";
import { Suspense } from "react";
import { createApp } from "../../components/Main";
import { createMemoryStorage } from "../../components/storage/MemoryStorage";

export async function createTestApp() {
  const { Main } = createApp({ storage: createMemoryStorage() });
  const screen = await render(
    <Suspense fallback={null}>
      <Main />
    </Suspense>,
  );
  return { screen };
}
