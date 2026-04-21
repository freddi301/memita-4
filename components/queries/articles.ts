import { StoreItem } from "./Queries";
import { contactList } from "./contacts";
import { groupBy, maxBy } from "./helpers";

export type ArticleUpdate = {
  type: "ArticleUpdate";
  accountId: string;
  createdAt: number;
  date:
    | {
        timestamp: number;
        duration: number;
      }
    | undefined;
  // location: {
  //   latitude: number;
  //   longitude: number;
  //   // address: string;
  // } | undefined;
  content: string;
  timestamp: number;
};

export function updateArticle({
  accountId,
  createdAt,
  date,
  content,
}: {
  accountId: string;
  createdAt: number;
  date:
    | {
        timestamp: number;
        duration: number;
      }
    | undefined;
  content: string;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "ArticleUpdate",
        accountId,
        createdAt,
        date,
        content,
        timestamp: Date.now(),
      },
    ];
  };
}

export function articleLatest({
  accountId,
  createdAt,
}: {
  accountId: string;
  createdAt: number;
}) {
  return (all: Array<StoreItem>) => {
    const updates = all
      .filter((item) => item.type === "ArticleUpdate")
      .filter(
        (update) =>
          update.accountId === accountId && update.createdAt === createdAt,
      );
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      return {
        date: latestUpdate.date,
        content: latestUpdate.content,
      };
    }
  };
}

export function articleList({ accountId }: { accountId: string }) {
  return (all: Array<StoreItem>) => {
    return contactList({ accountId })(all).flatMap((contact) => {
      return groupBy(
        all
          .filter((item) => item.type === "ArticleUpdate")
          .filter((update) => update.accountId === contact.contactId),
        (update) => [update.accountId, update.createdAt],
        (updates) => maxBy(updates, (update) => update.timestamp),
      )
        .filter((update) => update.content !== "")
        .map((update) => ({
          contactId: contact.contactId,
          contactName: contact.name,
          createdAt: update.createdAt,
          date: update.date,
          content: update.content,
        }));
    });
  };
}
