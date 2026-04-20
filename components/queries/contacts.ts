import { groupBy, maxBy } from "./helpers";
import { StoreItem } from "./Queries";

export type ContactUpdate = {
  type: "ContactUpdate";
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
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "ContactUpdate",
        accountId,
        contactId,
        name,
        deleted,
        timestamp: Date.now(),
      },
    ];
  };
}

export function contactList({ accountId }: { accountId: string }) {
  return (all: Array<StoreItem>) => {
    return groupBy(
      all
        .filter((item) => item.type === "ContactUpdate")
        .filter((update) => update.accountId === accountId),
      (update) => [update.contactId],
      (updates) => maxBy(updates, (update) => update.timestamp),
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
  return (all: Array<StoreItem>) => {
    const updates = all
      .filter((item) => item.type === "ContactUpdate")
      .filter(
        (update) =>
          update.accountId === accountId && update.contactId === contactId,
      );
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      if (!latestUpdate.deleted) return { name: latestUpdate.name };
    }
  };
}
