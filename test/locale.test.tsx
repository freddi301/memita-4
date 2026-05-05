import { render, userEvent } from "@testing-library/react-native";
import { createTestApp } from "./utils/createTestApp";

test("user sees system locale as default in device settings", async () => {
  const { Main } = await createTestApp();

  const user = userEvent.setup();
  const screen = await render(<Main />);

  await user.press(await screen.findByText("Settings"));
  expect(await screen.findByText("Language")).toBeVisible();
  expect(await screen.findByText("System default (🇬🇧 English)")).toBeVisible();
});

test("user can switch locale to italian", async () => {
  const { Main } = await createTestApp();

  const user = userEvent.setup();
  const screen = await render(<Main />);

  await user.press(await screen.findByText("Settings"));
  await user.press(await screen.findByText("System default (🇬🇧 English)"));
  await user.press(await screen.findByText("🇮🇹 Italian"));

  expect(await screen.findByText("Lingua")).toBeVisible();
  expect(await screen.findByText("🇮🇹 Italiano")).toBeVisible();
});
