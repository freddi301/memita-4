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
import { Root } from "./queries";

export function createAccountId() {
  return Math.random().toString(36).slice(2);
}

export type AccountUpdate = {
  id: string;
  name: string;
  deleted: boolean;
  timestamp: number;
};

export function updateAccount({
  id,
  name,
  deleted,
}: {
  id: string;
  name: string;
  deleted: boolean;
}): Query<Root> {
  return object({
    accounts: root.field("accounts").concat(
      array([
        object({
          id: string(id),
          name: string(name),
          deleted: boolean(deleted),
          timestamp: number(Date.now()),
        }),
      ])
    ),
    contacts: root.field("contacts"),
    articles: root.field("articles"),
  });
}

export function accountIds() {
  return root
    .field("accounts")
    .map((update) => update.field("id"))
    .uniqueBy((id) => id);
}

function accountLatests() {
  return accountIds().map((id) => {
    return root
      .field("accounts")
      .filter((update) => update.field("id").isEqual(id))
      .maxBy((update) => update.field("timestamp"));
  });
}

export function accountList() {
  return accountLatests()
    .filter((update) => update.field("deleted").not())
    .map((update) =>
      object({
        id: update.field("id"),
        name: update.field("name"),
      })
    );
}

export function accountLatest({ accountId }: { accountId?: string }) {
  if (!accountId) {
    return dataToQuery({ name: "" });
  }
  const latest = accountLatests().find((update) =>
    update.field("id").isEqual(string(accountId))
  );
  return object({
    name: latest.field("name"),
  });
}
