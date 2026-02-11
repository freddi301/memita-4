import { array, boolean, number, object, Query, string } from "./QL";

export type Root = {
  accounts: Array<{
    id: string;
    name: string;
    active: boolean;
    timestamp: number;
  }>;
};

export function createAccountId() {
  return Math.random().toString(36).slice(2);
}

export function allQueries(root: Query<Root>) {
  const accountUpdates = root.field("accounts");

  const accountIds = accountUpdates
    .map((update) => update.field("id"))
    .uniqueBy((id) => id);

  const accountHistories = accountIds.map((id) => {
    const history = accountUpdates
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

  const updateAccount = (
    id: string,
    name: string,
    active: boolean
  ): Query<Root> =>
    object({
      accounts: accountUpdates.concat(
        array([
          object({
            id: string(id),
            name: string(name),
            active: boolean(active),
            timestamp: number(Date.now()),
          }),
        ])
      ),
    });

  const accountHistory = (id: string) =>
    accountHistories
      .find((account) => account.field("id").isEqual(string(id)))
      .field("history");

  return {
    accountList,
    updateAccount,
    accountHistory,
  };
}
