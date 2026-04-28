import { render, userEvent } from "@testing-library/react-native";
import { Suspense } from "react";
import Index from "../app/index";

test("user sees system theme as default in device settings", async () => {
  const user = userEvent.setup();
  const screen = await render(
    <Suspense fallback={null}>
      <Index />
    </Suspense>,
  );

  await user.press(await screen.findByText("Settings"));
  expect(await screen.findByText("Theme")).toBeVisible();
  expect(
    await screen.findByText(/System default \((Dark|Light)\)/),
  ).toBeVisible();
});

test("user can switch theme to dark", async () => {
  const user = userEvent.setup();
  const screen = await render(
    <Suspense fallback={null}>
      <Index />
    </Suspense>,
  );

  await user.press(await screen.findByText("Settings"));
  await user.press(await screen.findByText(/System default \((Dark|Light)\)/));
  await user.press(await screen.findByText("Dark"));

  expect(await screen.findByText("Dark")).toBeVisible();
});
