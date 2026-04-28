import { render, userEvent } from "@testing-library/react-native";
import { Suspense } from "react";
import Index from "../app/index";
import { findIcon } from "./findIcon";

test("no accounts are shown on first app launch", async () => {
  const screen = await render(
    <Suspense fallback={null}>
      <Index />
    </Suspense>,
  );

  expect(await screen.findByText("No accounts on this device")).toBeVisible();
});

test("user can create an account and lands on profile", async () => {
  const user = userEvent.setup();
  const screen = await render(
    <Suspense fallback={null}>
      <Index />
    </Suspense>,
  );

  await user.press(await screen.findByText("Create new account"));
  expect(await screen.findByText("Account name")).toBeVisible();

  await user.type(
    screen.getByPlaceholderText(
      "This name is only visible to you on this device",
    ),
    "Alice",
  );

  await user.press(await findIcon(screen, "save"));

  expect(await screen.findByText("Alice")).toBeVisible();
  expect(await screen.findByText("Account settings")).toBeVisible();
});
