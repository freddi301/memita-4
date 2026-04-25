import * as z from "zod";
import { AccountId, AccountIdSchema } from "../cryptography/cryptography";
import { ContentAddress, ContentAddressSchema } from "../store/fileStore";
import { contactList } from "./contacts";
import { groupBy, maxBy, orderBy } from "./helpers";
import { StoreItem } from "./Queries";
import { nowTimestamp, Timestamp, TimestampSchema } from "./Timestamp";

export const DirectMessageUpdateSchema = z.object({
  type: z.literal("DirectMessageUpdate"),
  senderId: AccountIdSchema,
  receiverId: AccountIdSchema,
  createdAt: TimestampSchema,
  content: z.string(),
  attachments: z.array(
    z.object({ name: z.string(), hash: ContentAddressSchema }),
  ),
  isDraft: z.boolean(),
  timestamp: TimestampSchema,
});

export type DirectMessageUpdate = z.infer<typeof DirectMessageUpdateSchema>;

export function updateDirectMessage({
  senderId,
  receiverId,
  createdAt,
  isDraft,
  content,
  attachments,
}: {
  senderId: AccountId;
  receiverId: AccountId;
  createdAt: Timestamp;
  isDraft: boolean;
  content: string;
  attachments: Array<{ name: string; hash: ContentAddress }>;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "DirectMessageUpdate",
        senderId,
        receiverId,
        createdAt,
        isDraft,
        content,
        attachments,
        timestamp: nowTimestamp(),
      },
    ];
  };
}

export function directMessagesSummary({ accountId }: { accountId: AccountId }) {
  return (all: Array<StoreItem>) => {
    return contactList({ accountId })(all).map((contact) => {
      const messages = directMessagesList({
        accountId,
        contactId: contact.contactId,
      })(all);
      const lastMesssage = orderBy(
        messages,
        (update) => update.createdAt,
        "desc",
      )[0];
      const unread = messages.filter(
        (message) => message.receiverId === accountId && !message.didRead,
      ).length;
      return {
        contactId: contact.contactId,
        contactName: contact.name,
        lastMesssageCreatedAt: lastMesssage?.createdAt ?? 0,
        unread,
      };
    });
  };
}

export function directMessagesList({
  accountId,
  contactId,
}: {
  accountId: AccountId;
  contactId: AccountId;
}) {
  return (all: Array<StoreItem>) => {
    return orderBy(
      groupBy(
        all
          .filter((item) => item.type === "DirectMessageUpdate")
          .filter(
            (update) =>
              (update.senderId === accountId &&
                update.receiverId === contactId) ||
              (update.senderId === contactId &&
                update.receiverId === accountId),
          ),
        (update) => [update.senderId, update.receiverId, update.createdAt],
        (updates) => maxBy(updates, (update) => update.timestamp),
      ).filter(
        (update) => update.content !== "" || update.attachments.length > 0,
      ),
      (update) => update.createdAt,
      "asc",
    ).map((messageUpdate) => {
      return {
        senderId: messageUpdate.senderId,
        receiverId: messageUpdate.receiverId,
        createdAt: messageUpdate.createdAt,
        isDraft: messageUpdate.isDraft,
        content: messageUpdate.content,
        attachments: messageUpdate.attachments,
        didRead: didReadLatest({
          senderId: messageUpdate.senderId,
          receiverId: messageUpdate.receiverId,
          createdAt: messageUpdate.createdAt,
        })(all),
      };
    });
  };
}

export const DidReadDirectMessageUpdateSchema = z.object({
  type: z.literal("DidReadDirectMessageUpdate"),
  senderId: z.string(),
  receiverId: z.string(),
  createdAt: TimestampSchema,
  didRead: z.boolean(),
  timestamp: TimestampSchema,
});

export type DidReadDirectMessageUpdate = z.infer<
  typeof DidReadDirectMessageUpdateSchema
>;

export function updateDidReadDirectMessage({
  senderId,
  receiverId,
  createdAt,
  didRead,
}: {
  senderId: AccountId;
  receiverId: AccountId;
  createdAt: Timestamp;
  didRead: boolean;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "DidReadDirectMessageUpdate",
        senderId,
        receiverId,
        createdAt,
        didRead,
        timestamp: nowTimestamp(),
      },
    ];
  };
}

function didReadLatest({
  senderId,
  receiverId,
  createdAt,
}: {
  senderId: string;
  receiverId: string;
  createdAt: number;
}) {
  return (all: Array<StoreItem>) => {
    const updates = all
      .filter((item) => item.type === "DidReadDirectMessageUpdate")
      .filter(
        (update) =>
          update.senderId === senderId &&
          update.receiverId === receiverId &&
          update.createdAt === createdAt,
      );
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      return latestUpdate.didRead;
    }
    return false;
  };
}
