import { RootCollections } from "../persistance/dataApi";
import { collection } from "../persistance/helpers";

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
  return (root: RootCollections): RootCollections => {
    return {
      ...root,
      contacts: root.contacts.concat(
        collection([
          {
            accountId,
            contactId,
            name,
            deleted,
            timestamp: Date.now(),
          },
        ])
      ),
    };
  };
}

export function contactList({ accountId }: { accountId: string }) {
  return (root: RootCollections) => {
    return root.contacts
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
  return (root: RootCollections) => {
    return root.contacts
      .filter(
        (update) =>
          update.accountId === accountId && update.contactId === contactId
      )
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        name: update.name,
      }));
  };
}
