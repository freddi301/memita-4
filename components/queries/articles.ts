import { root } from "../persistance/dataApi";
import {
  array,
  dataToQuery,
  number,
  object,
  Query,
  string,
} from "../persistance/QL";
import { accountList } from "./accounts";
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
}): Query<Root> {
  return object({
    accounts: root.field("accounts"),
    contacts: root.field("contacts"),
    articles: root.field("articles").concat(
      array([
        object({
          accountId: string(accountId),
          createdAt: number(createdAt),
          content: string(content),
          timestamp: number(Date.now()),
        }),
      ])
    ),
  });
}

function articleHistories(accountId: string) {
  return contactList({ accountId })
    .concat(accountList())
    .flatMap((contact) => {
      const articleUpdates = root
        .field("articles")
        .filter((update) =>
          update.field("accountId").isEqual(contact.field("id"))
        );
      const arcticleIds = articleUpdates
        .map((update) => update.field("createdAt"))
        .uniqueBy((createdAt) => createdAt);
      const histories = arcticleIds.map((createdAt) => {
        const history = articleUpdates
          .filter((update) => update.field("createdAt").isEqual(createdAt))
          .orderBy((update) => update.field("timestamp"), "desc");
        const latest = history.maxBy((update) => update.field("timestamp"));
        return object({
          accountId: string(accountId),
          contactName: contact.field("name"),
          createdAt: createdAt,
          history,
          latest,
        });
      });
      return histories;
    });
}

export function articleLatest({
  accountId,
  createdAt,
}: {
  accountId: string;
  createdAt?: number;
}) {
  if (!createdAt) {
    return dataToQuery({ content: "" });
  }
  const update = articleHistories(accountId)
    .find((article) => article.field("createdAt").isEqual(number(createdAt)))
    .field("latest");
  return object({
    content: update.field("content"),
  });
}

export function articleList({ accountId }: { accountId: string }) {
  return articleHistories(accountId)
    .filter((article) =>
      article.field("latest").field("content").isEqual(string("")).not()
    )
    .map((article) =>
      object({
        accountId: article.field("accountId"),
        contactName: article.field("contactName"),
        createdAt: article.field("createdAt"),
        content: article.field("latest").field("content"),
      })
    );
}
