import * as z from "zod";
import { StoreItem } from "./Queries";
import { contactLatest } from "./contacts";
import { groupList } from "./groups";
import { groupBy, maxBy, orderBy } from "./helpers";

export const GroupMessageUpdateSchema = z.object({
  type: z.literal("GroupMessageUpdate"),
  senderId: z.string(),
  groupId: z.string(),
  createdAt: z.number(),
  content: z.string(),
  timestamp: z.number(),
});

export type GroupMessageUpdate = z.infer<typeof GroupMessageUpdateSchema>;

export function updateGroupMessage({
  senderId,
  groupId,
  createdAt,
  content,
}: {
  senderId: string;
  groupId: string;
  createdAt: number;
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
        timestamp: Date.now(),
      },
    ];
  };
}

export function groupMessagesSummary({ accountId }: { accountId: string }) {
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
      all
        .filter((item) => item.type === "GroupMessageUpdate")
        .filter((update) => update.groupId === groupId),
      (update) => [update.senderId, update.groupId, update.createdAt],
      (updates) => maxBy(updates, (update) => update.timestamp),
    ).filter((update) => update.content !== "");
  };
}

export function groupMessagesList({
  accountId,
  groupId,
}: {
  accountId: string;
  groupId: string;
}) {
  return (all: Array<StoreItem>) => {
    return orderBy(
      commonGroupMessagesList({ groupId })(all),
      (update) => update.createdAt,
      "asc",
    ).map((update) => {
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
