import { render, userEvent } from "@testing-library/react-native";
import { generateAccountSecret } from "../components/cryptography/cryptography";
import { addAccount, getAccounts } from "../components/queries/accounts";
import { createTestApp } from "./utils/createTestApp";
import { findIcon } from "./utils/findIcon";

test("no accounts are shown on first app launch", async () => {
  const { Main } = await createTestApp();

  const screen = await render(<Main />);

  expect(await screen.findByText("No accounts on this device")).toBeVisible();
});

test("user can create an account and lands on profile", async () => {
  const { Main } = await createTestApp();

  const user = userEvent.setup();
  const screen = await render(<Main />);

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

test("user sees account list", async () => {
  const { Main, api } = await createTestApp();

  await addAccount({ accountSecret: generateAccountSecret(), name: "Molly" })(
    api,
  );
  await addAccount({ accountSecret: generateAccountSecret(), name: "Polly" })(
    api,
  );

  const screen = await render(<Main />);

  expect(await getAccounts()(api)).toEqual([
    expect.objectContaining({ name: "Molly" }),
    expect.objectContaining({ name: "Polly" }),
  ]);

  expect(await screen.findByText("Molly")).toBeVisible();
  expect(await screen.findByText("Polly")).toBeVisible();
});
