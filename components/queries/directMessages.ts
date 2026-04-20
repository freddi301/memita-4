import { triggerNotification } from "../notifications";
import { contactList } from "./contacts";
import { groupBy, maxBy, orderBy } from "./helpers";
import { StoreItem } from "./Queries";

export type DirectMessageUpdate = {
  type: "DirectMessageUpdate";
  senderId: string;
  receiverId: string;
  createdAt: number;
  content: string;
  timestamp: number;
};

export function updateDirectMessage({
  senderId,
  receiverId,
  createdAt,
  content,
}: {
  senderId: string;
  receiverId: string;
  createdAt: number;
  content: string;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    triggerNotification();
    return [
      {
        type: "DirectMessageUpdate",
        senderId,
        receiverId,
        createdAt,
        content,
        timestamp: Date.now(),
      },
    ];
  };
}

export function directMessagesSummary({ accountId }: { accountId: string }) {
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
  accountId: string;
  contactId: string;
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
      ).filter((update) => update.content !== ""),
      (update) => update.createdAt,
      "asc",
    ).map((messageUpdate) => {
      return {
        senderId: messageUpdate.senderId,
        receiverId: messageUpdate.receiverId,
        createdAt: messageUpdate.createdAt,
        content: messageUpdate.content,
        didRead: didReadLatest({
          senderId: messageUpdate.senderId,
          receiverId: messageUpdate.receiverId,
          createdAt: messageUpdate.createdAt,
        })(all),
      };
    });
  };
}

export type DidReadDirectMessageUpdate = {
  type: "DidReadDirectMessageUpdate";
  senderId: string;
  receiverId: string;
  createdAt: number;
  didRead: boolean;
  timestamp: number;
};

export function updateDidReadDirectMessage({
  senderId,
  receiverId,
  createdAt,
  didRead,
}: {
  senderId: string;
  receiverId: string;
  createdAt: number;
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
        timestamp: Date.now(),
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
