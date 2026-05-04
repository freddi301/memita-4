import { userEvent } from "@testing-library/react-native";
import { createTestApp } from "./utils/createTestApp";
import { findIcon } from "./utils/findIcon";

test("no accounts are shown on first app launch", async () => {
  const { screen } = await createTestApp();

  expect(await screen.findByText("No accounts on this device")).toBeVisible();
});

test("user can create an account and lands on profile", async () => {
  const user = userEvent.setup();
  const { screen } = await createTestApp();

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
