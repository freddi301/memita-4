import { render, userEvent } from "@testing-library/react-native";
import {
  accountIdFromAccountSecret,
  generateAccountSecret,
} from "../components/cryptography/cryptography";
import { addAccount } from "../components/queries/accounts";
import { getContact } from "../components/queries/contacts";
import { createTestApp } from "./utils/createTestApp";
import { findIcon } from "./utils/findIcon";

test("user can add a contact", async () => {
  const { Main, api } = await createTestApp();

  const accountSecret = generateAccountSecret();
  const accountId = accountIdFromAccountSecret(accountSecret);
  await addAccount({ accountSecret, name: "Alice" })(api);

  const contactSecret = generateAccountSecret();
  const contactAccountId = accountIdFromAccountSecret(contactSecret);

  const user = userEvent.setup();
  const screen = await render(<Main />);

  // navigate into Alice's direct messages
  await user.press(await screen.findByText("Alice"));

  // open new contact form
  await user.press(await findIcon(screen, "user-plus"));

  // fill in contact account id and name
  await user.type(
    await screen.findByPlaceholderText(
      "Paste the account id your contact shared with you",
    ),
    contactAccountId,
  );
  await user.type(
    screen.getByPlaceholderText("This name is only visible to you"),
    "Bob",
  );

  // save — should navigate to contact's profile
  await user.press(await findIcon(screen, "save"));

  expect(await screen.findByText("Bob")).toBeVisible();

  expect(
    await getContact({ accountId: accountId, contactId: contactAccountId })(
      api,
    ),
  ).toEqual({ name: "Bob" });
});
