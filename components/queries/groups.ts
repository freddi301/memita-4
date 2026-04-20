import { StoreItem } from "./Queries";
import { groupBy, maxBy } from "./helpers.ts";

export type GroupUpdate = {
  type: "GroupUpdate";
  accountId: string;
  groupId: string;
  name: string;
  deleted: boolean;
  timestamp: number;
};

export function updateGroup({
  accountId,
  groupId,
  name,
  deleted,
}: {
  accountId: string;
  groupId: string;
  name: string;
  deleted: boolean;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "GroupUpdate",
        accountId,
        groupId,
        name,
        deleted,
        timestamp: Date.now(),
      },
    ];
  };
}

export function groupList({ accountId }: { accountId: string }) {
  return (all: Array<StoreItem>) => {
    return groupBy(
      all
        .filter((item) => item.type === "GroupUpdate")
        .filter((update) => update.accountId === accountId),
      (update) => [update.groupId],
      (updates) => maxBy(updates, (update) => update.timestamp),
    )
      .filter((update) => !update.deleted)
      .map((update) => ({
        groupId: update.groupId,
        name: update.name,
      }));
  };
}

export function groupLatest({
  accountId,
  groupId,
}: {
  accountId: string;
  groupId: string;
}) {
  return (all: Array<StoreItem>) => {
    const updates = all
      .filter((item) => item.type === "GroupUpdate")
      .filter(
        (update) =>
          update.accountId === accountId && update.groupId === groupId,
      );
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      return {
        name: latestUpdate.name,
      };
    }
  };
}
