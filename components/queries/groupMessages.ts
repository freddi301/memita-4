import * as z from "zod";
import { AccountId, AccountIdSchema } from "../cryptography/cryptography";
import { StoreItem } from "./Queries";
import { nowTimestamp, Timestamp, TimestampSchema } from "./Timestamp";
import { contactLatest } from "./contacts";
import { groupList } from "./groups";
import { groupBy, maxBy, orderBy } from "./helpers";

export const GroupMessageUpdateSchema = z.object({
  type: z.literal("GroupMessageUpdate"),
  senderId: AccountIdSchema,
  groupId: z.string(), // TODO use branded type
  createdAt: TimestampSchema,
  content: z.string(),
  timestamp: TimestampSchema,
});

export type GroupMessageUpdate = z.infer<typeof GroupMessageUpdateSchema>;

export function updateGroupMessage({
  senderId,
  groupId,
  createdAt,
  content,
}: {
  senderId: AccountId;
  groupId: string;
  createdAt: Timestamp;
  content: string;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "GroupMessageUpdate",
        senderId,
        groupId,
        createdAt,
        content,
        timestamp: nowTimestamp(),
      },
    ];
  };
}

export function groupMessagesSummary({ accountId }: { accountId: AccountId }) {
  return (all: Array<StoreItem>) => {
    return orderBy(
      groupList({ accountId })(all).map((group) => {
        const lastMessage = orderBy(
          commonGroupMessagesList({ groupId: group.groupId })(all),
          (update) => update.createdAt,
          "desc",
        )[0];
        return {
          groupId: group.groupId,
          groupName: group.name,
          lastMessageCreatedAt: lastMessage?.createdAt ?? 0,
        };
      }),
      (update) => update.lastMessageCreatedAt,
      "desc",
    );
  };
}

export function commonGroupMessagesList({ groupId }: { groupId: string }) {
  return (all: Array<StoreItem>) => {
    return groupBy(
      all.filter((item) => item.type === "GroupMessageUpdate").filter((update) => update.groupId === groupId),
      (update) => [update.senderId, update.groupId, update.createdAt],
      (updates) => maxBy(updates, (update) => update.timestamp),
    ).filter((update) => update.content !== "");
  };
}

export function groupMessagesList({
  accountId,
  groupId,
}: {
  accountId: AccountId;
  groupId: string; // TODO use branded type
}) {
  return (all: Array<StoreItem>) => {
    return orderBy(commonGroupMessagesList({ groupId })(all), (update) => update.createdAt, "asc").map((update) => {
      const contactUpdate = contactLatest({
        accountId,
        contactId: update.senderId,
      })(all);
      return {
        senderId: update.senderId,
        senderName: contactUpdate?.name,
        createdAt: update.createdAt,
        content: update.content,
      };
    });
  };
}
