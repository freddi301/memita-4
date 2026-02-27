import { collection } from "../persistance/helpers";
import { contactList } from "./contacts";
import { Root } from "./queries";

export type ArticleUpdate = {
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
  return (root: Root): Root => {
    return {
      ...root,
      articles: root.articles.concat([
        {
          accountId,
          createdAt,
          date,
          content,
          timestamp: Date.now(),
        },
      ]),
    };
  };
}

export function articleLatest({
  accountId,
  createdAt,
}: {
  accountId: string;
  createdAt: number;
}) {
  return (root: Root) => {
    return collection(root.articles)
      .filter(
        (update) =>
          update.accountId === accountId && update.createdAt === createdAt
      )
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        date: update.date,
        content: update.content,
      }));
  };
}

export function articleList({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return contactList({ accountId })(root).flatMap((contact) => {
      return collection(root.articles)
        .filter((update) => update.accountId === contact.contactId)
        .groupBy(
          (update) => [update.accountId, update.createdAt],
          (updates) => updates.maxBy((update) => update.timestamp)
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
