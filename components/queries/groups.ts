import * as z from "zod";
import { AccountId, AccountIdSchema } from "../cryptography/cryptography";
import { StoreItem } from "./Queries";
import { nowTimestamp, TimestampSchema } from "./Timestamp";
import { groupBy, maxBy } from "./helpers";

export const GroupUpdateSchema = z.object({
  type: z.literal("GroupUpdate"),
  accountId: AccountIdSchema,
  groupId: z.string(), // TODO use branded type
  name: z.string(),
  deleted: z.boolean(),
  timestamp: TimestampSchema,
});

export type GroupUpdate = z.infer<typeof GroupUpdateSchema>;

export function updateGroup({
  accountId,
  groupId,
  name,
  deleted,
}: {
  accountId: AccountId;
  groupId: string; // TODO use branded type
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
        timestamp: nowTimestamp(),
      },
    ];
  };
}

export function groupList({ accountId }: { accountId: AccountId }) {
  return (all: Array<StoreItem>) => {
    return groupBy(
      all.filter((item) => item.type === "GroupUpdate").filter((update) => update.accountId === accountId),
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
  accountId: AccountId;
  groupId: string; // TODO use branded type
}) {
  return (all: Array<StoreItem>) => {
    const updates = all
      .filter((item) => item.type === "GroupUpdate")
      .filter((update) => update.accountId === accountId && update.groupId === groupId);
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      return {
        name: latestUpdate.name,
      };
    }
  };
}
