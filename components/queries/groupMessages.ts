import { collection } from "../persistance/helpers";
import { groupList } from "./groups";
import { Root } from "./queries";

export type GroupMessageUpdate = {
  senderId: string;
  groupId: string;
  createdAt: number;
  content: string;
  timestamp: number;
};

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
  return (root: Root): Root => {
    return {
      ...root,
      groupMessages: root.groupMessages.concat([
        {
          senderId,
          groupId,
          createdAt,
          content,
          timestamp: Date.now(),
        },
      ]),
    };
  };
}

export function groupMessagesSummary({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return groupList({ accountId })(root).flatMap((group) => {
      return collection(root.groupMessages)
        .filter((update) => update.groupId === group.groupId)
        .groupBy(
          (update) => [update.senderId, update.groupId, update.createdAt],
          (updates) => updates.maxBy((update) => update.timestamp)
        )
        .concat(
          collection([
            {
              senderId: accountId,
              groupId: group.groupId,
              createdAt: 0,
              content: "",
              timestamp: 0,
            },
          ])
        )
        .groupBy(
          (update) => [update.groupId],
          (updates) => updates.maxBy((update) => update.createdAt)
        )
        .orderBy((update) => update.createdAt, "desc")
        .map((update) => ({
          groupId: group.groupId,
          groupName: group.name,
          createdAt: update.createdAt,
        }));
    });
  };
}

export function groupMessagesList({
  accountId,
  groupId,
}: {
  accountId: string;
  groupId: string;
}) {
  return (root: Root) => {
    return collection(root.groupMessages)
      .filter((update) => update.groupId === groupId)
      .groupBy(
        (update) => [update.senderId, update.groupId, update.createdAt],
        (updates) => updates.maxBy((update) => update.timestamp)
      )
      .orderBy((update) => update.createdAt, "asc")
      .flatMap((messageUpdate) => {
        return collection(root.contacts)
          .filter(
            (contactUpdate) =>
              contactUpdate.accountId === accountId &&
              contactUpdate.contactId === messageUpdate.senderId
          )
          .concat(
            collection([
              {
                accountId,
                contactId: messageUpdate.senderId,
                name: "",
                deleted: false,
                timestamp: 0,
              },
            ])
          )
          .maxBy((update) => update.timestamp)
          .map((contactUpdate) => ({
            senderId: messageUpdate.senderId,
            senderName: contactUpdate.name,
            createdAt: messageUpdate.createdAt,
            content: messageUpdate.content,
          }));
      });
  };
}
