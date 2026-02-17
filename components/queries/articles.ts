import { collection } from "../persistance/helpers";
import { accountLatest } from "./accounts";
import { contactList } from "./contacts";
import { Root } from "./queries";

export type ArticleUpdate = {
  accountId: string;
  createdAt: number;
  content: string;
  timestamp: number;
};

export function updateArticle({
  accountId,
  createdAt,
  content,
}: {
  accountId: string;
  createdAt: number;
  content: string;
}) {
  return (root: Root): Root => {
    return {
      ...root,
      articles: root.articles.concat([
        {
          accountId,
          createdAt,
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
      .filter((update) => update.accountId === accountId)
      .filter((update) => update.createdAt === createdAt)
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        content: update.content,
      }));
  };
}

export function articleList({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return contactList({ accountId })(root)
      .concat(
        accountLatest({ accountId })(root).map((account) => ({
          contactId: accountId,
          name: account.name,
        }))
      )
      .flatMap((contact) => {
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
            accountId: update.accountId,
            createdAt: update.createdAt,
            content: update.content,
          }));
      });
  };
}
