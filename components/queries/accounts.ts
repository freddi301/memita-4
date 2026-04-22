import { AccountId } from "../cryptography/cryptography";
import { groupBy, maxBy } from "./helpers";
import { StoreItem } from "./Queries";
import { nowTimestamp } from "./Timestamp";

export function updateAccount({ accountId, name, deleted }: { accountId: AccountId; name: string; deleted: boolean }) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "ContactUpdate",
        accountId,
        contactId: accountId,
        name,
        deleted,
        timestamp: nowTimestamp(),
      },
    ];
  };
}

export function accountList() {
  return (all: Array<StoreItem>) => {
    return groupBy(
      all.filter((item) => item.type === "ContactUpdate").filter((update) => update.accountId === update.contactId),
      (update) => [update.accountId],
      (updates) => maxBy(updates, (update) => update.timestamp),
    )
      .filter((update) => !update.deleted)
      .map((update) => ({
        accountId: update.accountId,
        name: update.name,
      }));
  };
}

export function accountLatest({ accountId }: { accountId: AccountId | undefined }) {
  return (all: Array<StoreItem>) => {
    const udpates = all
      .filter((item) => item.type === "ContactUpdate")
      .filter((update) => update.accountId === accountId && update.contactId === accountId);
    if (udpates.length) {
      const latestUpdate = maxBy(udpates, (update) => update.timestamp);
      if (!latestUpdate.deleted) return { name: latestUpdate.name };
    }
  };
}
