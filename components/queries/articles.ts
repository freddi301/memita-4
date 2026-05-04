import * as z from "zod";
import { AccountId, AccountIdSchema } from "../cryptography/cryptography";
import { DataItem } from "./Queries";
import { nowTimestamp, Timestamp, TimestampSchema } from "./Timestamp";
import { contactList } from "./contacts";
import { groupBy, maxBy } from "./helpers";

export const ArticleUpdateSchema = z.object({
  type: z.literal("ArticleUpdate"),
  accountId: AccountIdSchema,
  createdAt: TimestampSchema,
  date: z
    .object({ timestamp: TimestampSchema, duration: z.number() })
    .optional(),
  content: z.string(),
  timestamp: TimestampSchema,
});

export function updateArticle({
  accountId,
  createdAt,
  date,
  content,
}: {
  accountId: AccountId;
  createdAt: Timestamp;
  date: { timestamp: Timestamp; duration: number } | undefined;
  content: string;
}) {
  return (all: Array<DataItem>): Array<DataItem> => {
    return [
      {
        type: "ArticleUpdate",
        accountId,
        createdAt,
        date,
        content,
        timestamp: nowTimestamp(),
      },
    ];
  };
}

export function articleLatest({
  accountId,
  createdAt,
}: {
  accountId: AccountId;
  createdAt: number;
}) {
  return (all: Array<DataItem>) => {
    const updates = all
      .filter((item) => item.type === "ArticleUpdate")
      .filter(
        (update) =>
          update.accountId === accountId && update.createdAt === createdAt,
      );
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      return { date: latestUpdate.date, content: latestUpdate.content };
    }
  };
}

export function articleList({ accountId }: { accountId: AccountId }) {
  return (all: Array<DataItem>) => {
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
