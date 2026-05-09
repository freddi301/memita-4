import { render, userEvent } from "@testing-library/react-native";
import {
  accountIdFromAccountSecret,
  generateAccountSecret,
} from "../components/cryptography/cryptography";
import { addAccount } from "../components/queries/accounts";
import { updateContact } from "../components/queries/contacts";
import { createTestApp } from "./utils/createTestApp";
import { findIcon } from "./utils/findIcon";

// TODO reenable when properly implemented networking
test.skip("a draft direct message is not delivered to the recipient", async () => {
  const aliceSecret = generateAccountSecret();
  const aliceId = accountIdFromAccountSecret(aliceSecret);

  const bobSecret = generateAccountSecret();
  const bobId = accountIdFromAccountSecret(bobSecret);

  const { Main: AliceApp, api: aliceApi } = await createTestApp();
  const { Main: BobApp, api: bobApi } = await createTestApp();

  await addAccount({ accountSecret: aliceSecret, name: "Alice" })(aliceApi);
  await updateContact({
    accountId: aliceId,
    contactId: bobId,
    name: "Bob",
    deleted: false,
  })(aliceApi);

  await addAccount({ accountSecret: bobSecret, name: "Bob" })(bobApi);
  await updateContact({
    accountId: bobId,
    contactId: aliceId,
    name: "Alice",
    deleted: false,
  })(bobApi);

  // Alice creates a draft (does not send)
  const aliceUser = userEvent.setup();
  const aliceScreen = await render(<AliceApp />);

  await aliceUser.press(await aliceScreen.findByText("Alice"));
  await aliceUser.press(await aliceScreen.findByText("Bob"));
  await aliceUser.type(
    await aliceScreen.findByPlaceholderText("Write a message"),
    "Draft only message",
  );
  await aliceUser.press(await findIcon(aliceScreen, "sticky-note"));

  // draft is visible in Alice's conversation
  expect(await aliceScreen.findByText("Draft only message")).toBeVisible();

  // Alice also sends a real (non-draft) message
  await aliceUser.type(
    await aliceScreen.findByPlaceholderText("Write a message"),
    "Sent message",
  );
  await aliceUser.press(await findIcon(aliceScreen, "sticky-note"));
  await aliceUser.press(await findIcon(aliceScreen, "send"));

  expect(await aliceScreen.findByText("Sent message")).toBeVisible();

  // Bob's app: open conversation with Alice — the draft must not appear there
  const bobUser = userEvent.setup();
  const bobScreen = await render(<BobApp />);

  await bobUser.press(await bobScreen.findByText("Bob"));
  await bobUser.press(await bobScreen.findByText("Alice"));

  expect(await bobScreen.findByText("No messages")).toBeVisible();
  expect(bobScreen.queryByText("Draft only message")).toBeNull();

  // TODO reenable
  // this will fail until networking is wired up between the two app instances
  expect(await bobScreen.findByText("Sent message")).toBeVisible();
});
