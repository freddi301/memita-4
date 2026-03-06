import { triggerNotification } from "../notifications";
import { RootCollections } from "../persistance/dataApi";
import { collection } from "../persistance/helpers";
import { contactList } from "./contacts";

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
  return (root: RootCollections): RootCollections => {
    triggerNotification();
    return {
      ...root,
      directMessages: root.directMessages.concat(
        collection([
          {
            senderId,
            receiverId,
            createdAt,
            content,
            timestamp: Date.now(),
          },
        ])
      ),
    };
  };
}

export function directMessagesSummary({ accountId }: { accountId: string }) {
  return (root: RootCollections) => {
    return contactList({ accountId })(root)
      .flatMap((contact) =>
        root.directMessages
          .filter(
            (update) =>
              (update.senderId === accountId &&
                update.receiverId === contact.contactId) ||
              (update.senderId === contact.contactId &&
                update.receiverId === accountId)
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
            (update) => [update.senderId, update.receiverId, update.createdAt],
            (updates) => updates.maxBy((update) => update.timestamp)
          )
          .flatMap((messageUpdate) =>
            root.didReadDirectMessages
              .filter(
                (didReadUpdate) =>
                  didReadUpdate.senderId === messageUpdate.senderId &&
                  didReadUpdate.receiverId === messageUpdate.receiverId &&
                  didReadUpdate.createdAt === messageUpdate.createdAt
              )
              .concat(
                collection([
                  {
                    senderId: messageUpdate.senderId,
                    receiverId: messageUpdate.receiverId,
                    createdAt: messageUpdate.createdAt,
                    didRead: true,
                    timestamp: 0,
                  },
                ])
              )
              .maxBy((update) => update.timestamp)
              .map((didReadUpdate) => ({
                senderId: messageUpdate.senderId,
                receiverId: messageUpdate.receiverId,
                createdAt: messageUpdate.createdAt,
                didRead: didReadUpdate.didRead,
              }))
          )
          .groupBy(
            (update) =>
              update.senderId.localeCompare(update.receiverId) > 0
                ? [update.senderId, update.receiverId]
                : [update.receiverId, update.senderId],
            (updates) => updates.maxBy((update) => update.createdAt)
          )
          .map((update) => ({
            contactId: contact.contactId,
            contactName: contact.name,
            createdAt: update.createdAt,
            unread: update.didRead ? 0 : 1,
          }))
      )
      .orderBy((update) => update.createdAt, "desc");
  };
}

export function directMessagesList({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId: string;
}) {
  return (root: RootCollections) => {
    return root.directMessages
      .filter(
        (update) =>
          (update.senderId === accountId && update.receiverId === contactId) ||
          (update.senderId === contactId && update.receiverId === accountId)
      )
      .groupBy(
        (update) => [update.senderId, update.receiverId, update.createdAt],
        (updates) => updates.maxBy((update) => update.timestamp)
      )
      .filter((update) => update.content !== "")
      .orderBy((update) => update.createdAt, "asc")
      .flatMap((messageUpdate) =>
        root.didReadDirectMessages
          .filter(
            (didReadUpdate) =>
              didReadUpdate.senderId === messageUpdate.senderId &&
              didReadUpdate.receiverId === messageUpdate.receiverId &&
              didReadUpdate.createdAt === messageUpdate.createdAt
          )
          .concat(
            collection([
              {
                senderId: messageUpdate.senderId,
                receiverId: messageUpdate.receiverId,
                createdAt: messageUpdate.createdAt,
                didRead: false,
                timestamp: 0,
              },
            ])
          )
          .maxBy((update) => update.timestamp)
          .map((didReadUpdate) => ({
            senderId: messageUpdate.senderId,
            receiverId: messageUpdate.receiverId,
            createdAt: messageUpdate.createdAt,
            content: messageUpdate.content,
            didRead: didReadUpdate.didRead,
          }))
      );
  };
}

export type DidReadDirectMessageUpdate = {
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
  return (root: RootCollections): RootCollections => {
    return {
      ...root,
      didReadDirectMessages: root.didReadDirectMessages.concat(
        collection([
          {
            senderId,
            receiverId,
            createdAt,
            didRead,
            timestamp: Date.now(),
          },
        ])
      ),
    };
  };
}
