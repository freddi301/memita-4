import { root } from "../persistance/dataApi";
import {
  array,
  boolean,
  dataToQuery,
  number,
  object,
  Query,
  string,
} from "../persistance/QL";
import { accountIds } from "./accounts";
import { Root } from "./queries";

export type ContactUpdate = {
  accountId: string;
  contactId: string;
  name: string;
  deleted: boolean;
  timestamp: number;
};

export function updateContact({
  accountId,
  contactId,
  name,
  deleted,
}: {
  accountId: string;
  contactId: string;
  name: string;
  deleted: boolean;
}): Query<Root> {
  return object({
    accounts: root.field("accounts"),
    contacts: root.field("contacts").concat(
      array([
        object({
          accountId: string(accountId),
          contactId: string(contactId),
          name: string(name),
          deleted: boolean(deleted),
          timestamp: number(Date.now()),
        }),
      ])
    ),
    articles: root.field("articles"),
  });
}

function contactHistories() {
  return accountIds().flatMap((accountId) => {
    const contactIds = root
      .field("contacts")
      .filter((update) => update.field("accountId").isEqual(accountId))
      .map((update) => update.field("contactId"))
      .uniqueBy((id) => id);
    return contactIds.map((contactId) => {
      const history = root
        .field("contacts")
        .filter((update) => update.field("accountId").isEqual(accountId))
        .filter((update) => update.field("contactId").isEqual(contactId))
        .orderBy((update) => update.field("timestamp"), "desc");
      const latest = history.maxBy((update) => update.field("timestamp"));
      return object({ accountId, contactId, history, latest });
    });
  });
}

export function contactList({ accountId }: { accountId: string }) {
  return contactHistories()
    .filter((contact) => contact.field("accountId").isEqual(string(accountId)))
    .filter((contact) => contact.field("latest").field("deleted").not())
    .map((account) =>
      object({
        id: account.field("contactId"),
        name: account.field("latest").field("name"),
      })
    );
}

const contactHistory = (accountId: string, contactId: string) =>
  contactHistories()
    .find(
      (contact) =>
        contact.field("accountId").isEqual(string(accountId)) &&
        contact.field("contactId").isEqual(string(contactId))
    )
    .field("history");

export function contactLatest({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId?: string;
}) {
  if (!contactId) {
    return dataToQuery({ name: "" });
  }
  const update = contactHistory(accountId, contactId).maxBy((update) =>
    update.field("timestamp")
  );
  return object({
    name: update.field("name"),
  });
}
