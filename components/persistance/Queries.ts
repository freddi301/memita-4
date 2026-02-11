import { array, boolean, number, object, Query, string } from "./QL";

export type Root = {
  accounts: Array<{
    id: string;
    name: string;
    active: boolean;
    timestamp: number;
  }>;
  contacts: Array<{
    accountId: string;
    contactId: string;
    name: string;
    active: boolean;
    timestamp: number;
  }>;
};

export function createAccountId() {
  return Math.random().toString(36).slice(2);
}

export function allQueries(root: Query<Root>) {
  const accountIds = root
    .field("accounts")
    .map((update) => update.field("id"))
    .uniqueBy((id) => id);

  const accountHistories = accountIds.map((id) => {
    const history = root
      .field("accounts")
      .filter((update) => update.field("id").isEqual(id))
      .orderBy((update) => update.field("timestamp"), "desc");
    const latest = history.maxBy((update) => update.field("timestamp"));
    return object({ id, history, latest });
  });

  const accountList = accountHistories
    .filter((account) => account.field("latest").field("active"))
    .map((account) =>
      object({
        id: account.field("id"),
        name: account.field("latest").field("name"),
      })
    );

  const updateAccount = ({
    id,
    name,
    active,
  }: {
    id: string;
    name: string;
    active: boolean;
  }): Query<Root> =>
    object({
      accounts: root.field("accounts").concat(
        array([
          object({
            id: string(id),
            name: string(name),
            active: boolean(active),
            timestamp: number(Date.now()),
          }),
        ])
      ),
      contacts: root.field("contacts"),
    });

  const accountHistory = (id: string) =>
    accountHistories
      .find((account) => account.field("id").isEqual(string(id)))
      .field("history");

  const accountLatest = (id: string) =>
    accountHistory(id).maxBy((update) => update.field("timestamp"));

  const updateContact = ({
    accountId,
    contactId,
    name,
    active,
  }: {
    accountId: string;
    contactId: string;
    name: string;
    active: boolean;
  }): Query<Root> =>
    object({
      accounts: root.field("accounts"),
      contacts: root.field("contacts").concat(
        array([
          object({
            accountId: string(accountId),
            contactId: string(contactId),
            name: string(name),
            active: boolean(active),
            timestamp: number(Date.now()),
          }),
        ])
      ),
    });

  const contactHistories = accountIds.flatMap((accountId) => {
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

  const contactList = (accountId: string) =>
    contactHistories
      .filter((contact) =>
        contact.field("accountId").isEqual(string(accountId))
      )
      .filter((contact) => contact.field("latest").field("active"))
      .map((account) =>
        object({
          id: account.field("contactId"),
          name: account.field("latest").field("name"),
        })
      );

  const contactHistory = (accountId: string, contactId: string) =>
    contactHistories
      .find(
        (contact) =>
          contact.field("accountId").isEqual(string(accountId)) &&
          contact.field("contactId").isEqual(string(contactId))
      )
      .field("history");

  const contactLatest = (accountId: string, contactId: string) =>
    contactHistory(accountId, contactId).maxBy((update) =>
      update.field("timestamp")
    );

  return {
    accountList,
    updateAccount,
    accountLatest,
    contactList,
    updateContact,
    contactLatest,
  };
}
