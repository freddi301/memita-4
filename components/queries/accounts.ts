import { collection } from "../persistance/helpers";
import { Root } from "./queries";

export function createAccountId() {
  return Math.random().toString(36).slice(2);
}

export type AccountUpdate = { accountId: string; accountSecret: string };

export function updateAccount({
  accountId,
  name,
  deleted,
}: {
  accountId: string;
  name: string;
  deleted: boolean;
}) {
  return (root: Root): Root => {
    return {
      ...root,
      contacts: root.contacts.concat([
        {
          accountId,
          contactId: accountId,
          name,
          deleted,
          timestamp: Date.now(),
        },
      ]),
    };
  };
}

export function accountList() {
  return (root: Root) => {
    return collection(root.contacts)
      .filter((update) => update.accountId === update.contactId)
      .groupBy(
        (update) => [update.accountId],
        (updates) => updates.maxBy((update) => update.timestamp)
      )
      .filter((update) => !update.deleted)
      .map((update) => ({
        accountId: update.accountId,
        name: update.name,
      }));
  };
}

export function accountLatest({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return collection(root.contacts)
      .filter(
        (update) =>
          update.accountId === accountId && update.contactId === accountId
      )
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        name: update.name,
      }));
  };
}
