import { collection } from "../persistance/helpers";
import { Root } from "./queries";

export type GroupUpdate = {
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
  return (root: Root): Root => {
    return {
      ...root,
      groups: root.groups.concat([
        {
          accountId,
          groupId,
          name,
          deleted,
          timestamp: Date.now(),
        },
      ]),
    };
  };
}

export function groupList({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return collection(root.groups)
      .filter((update) => update.accountId === accountId)
      .groupBy(
        (update) => [update.groupId],
        (updates) => updates.maxBy((update) => update.timestamp)
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
  return (root: Root) => {
    return collection(root.groups)
      .filter(
        (update) => update.accountId === accountId && update.groupId === groupId
      )
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        name: update.name,
      }));
  };
}
