import { collection } from "../persistance/helpers";
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
}) {
  return (root: Root): Root => {
    return {
      ...root,
      contacts: root.contacts.concat([
        {
          accountId,
          contactId,
          name,
          deleted,
          timestamp: Date.now(),
        },
      ]),
    };
  };
}

export function contactList({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return collection(root.contacts)
      .filter((update) => update.accountId === accountId)
      .groupBy(
        (update) => [update.contactId],
        (updates) => updates.maxBy((update) => update.timestamp)
      )
      .filter((update) => !update.deleted)
      .map((update) => ({
        contactId: update.contactId,
        name: update.name,
      }));
  };
}

export function contactLatest({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId: string;
}) {
  return (root: Root) => {
    return collection(root.contacts)
      .filter((update) => update.accountId === accountId)
      .filter((update) => update.contactId === contactId)
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        name: update.name,
      }));
  };
}
