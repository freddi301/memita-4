import { RootCollections } from "../persistance/dataApi";
import { collection } from "../persistance/helpers";

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
  return (root: RootCollections): RootCollections => {
    return {
      ...root,
      groups: root.groups.concat(
        collection([
          {
            accountId,
            groupId,
            name,
            deleted,
            timestamp: Date.now(),
          },
        ])
      ),
    };
  };
}

export function groupList({ accountId }: { accountId: string }) {
  return (root: RootCollections) => {
    return root.groups
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
  return (root: RootCollections) => {
    return root.groups
      .filter(
        (update) => update.accountId === accountId && update.groupId === groupId
      )
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        name: update.name,
      }));
  };
}
