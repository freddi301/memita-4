import { collection } from "../persistance/helpers";
import { Root } from "./queries";

export type BiographyUpdate = {
  accountId: string;
  content: string;
  timestamp: number;
};

export function updateBiography({
  accountId,
  content,
}: {
  accountId: string;
  content: string;
}) {
  return (root: Root): Root => {
    return {
      ...root,
      biographies: root.biographies.concat([
        {
          accountId,
          content,
          timestamp: Date.now(),
        },
      ]),
    };
  };
}

export function biographyLatest({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return collection(root.biographies)
      .filter((update) => update.accountId === accountId)
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        content: update.content,
      }));
  };
}
