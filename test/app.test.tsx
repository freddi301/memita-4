import { render } from "@testing-library/react-native";
import { Suspense } from "react";
import Index from "../app/index";

test("app starts", async () => {
  const screen = await render(
    <Suspense fallback={null}>
      <Index />
    </Suspense>,
  );

  expect(await screen.findByText("Memita")).toBeVisible();
});
