import { triggerNotification } from "../notifications";
import { collection } from "../persistance/helpers";
import { contactList } from "./contacts";
import { Root } from "./queries";

export type DirectMessageUpdate = {
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
  return (root: Root): Root => {
    triggerNotification();
    return {
      ...root,
      directMessages: root.directMessages.concat([
        {
          senderId,
          receiverId,
          createdAt,
          content,
          timestamp: Date.now(),
        },
      ]),
    };
  };
}

export function directMessagesSummary({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return contactList({ accountId })(root).flatMap((contact) => {
      return collection(root.directMessages)
        .filter(
          (update) =>
            (update.senderId === accountId &&
              update.receiverId === contact.contactId) ||
            (update.senderId === contact.contactId &&
              update.receiverId === accountId)
        )
        .groupBy(
          (update) => [update.senderId, update.receiverId, update.createdAt],
          (updates) => updates.maxBy((update) => update.timestamp)
        )
        .concat(
          collection([
            {
              senderId: accountId,
              receiverId: contact.contactId,
              createdAt: 0,
              content: "",
              timestamp: 0,
            },
          ])
        )
        .groupBy(
          (update) =>
            update.senderId.localeCompare(update.receiverId)
              ? [update.senderId, update.receiverId]
              : [update.receiverId, update.senderId],
          (updates) => updates.maxBy((update) => update.createdAt)
        )
        .orderBy((update) => update.createdAt, "desc")
        .map((update) => ({
          contactId: contact.contactId,
          contactName: contact.name,
          createdAt: update.createdAt,
        }));
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
  return (root: Root) => {
    return collection(root.directMessages)
      .filter(
        (update) =>
          (update.senderId === accountId && update.receiverId === contactId) ||
          (update.senderId === contactId && update.receiverId === accountId)
      )
      .groupBy(
        (update) => [update.senderId, update.receiverId, update.createdAt],
        (updates) => updates.maxBy((update) => update.timestamp)
      )
      .orderBy((update) => update.createdAt, "asc")
      .map((update) => ({
        senderId: update.senderId,
        receiverId: update.receiverId,
        createdAt: update.createdAt,
        content: update.content,
      }));
  };
}
