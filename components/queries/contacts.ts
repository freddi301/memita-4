import * as z from "zod";
import { AccountId, AccountIdSchema } from "../cryptography/cryptography";
import { MemitaMutation, MemitaQuery } from "../store/feApi";
import { groupBy, maxBy } from "./helpers";
import { DataItem } from "./Queries";
import { nowTimestamp, TimestampSchema } from "./Timestamp";

export const ContactUpdateSchema = z.object({
  type: z.literal("ContactUpdate"),
  accountId: AccountIdSchema,
  contactId: AccountIdSchema,
  name: z.string(),
  deleted: z.boolean(),
  timestamp: TimestampSchema,
});

export const updateContact: MemitaMutation<{
  accountId: AccountId;
  contactId: AccountId;
  name: string;
  deleted: boolean;
}> =
  ({ accountId, contactId, name, deleted }) =>
  async ({ appStorage }) => {
    await appStorage.write((current) => {
      return {
        ...current,
        data: [
          ...current.data,
          {
            type: "ContactUpdate",
            accountId,
            contactId,
            name,
            deleted,
            timestamp: nowTimestamp(),
          },
        ],
      };
    });
  };

export function contactList({ accountId }: { accountId: AccountId }) {
  return (all: Array<DataItem>) => {
    return groupBy(
      all
        .filter((item) => item.type === "ContactUpdate")
        .filter((update) => update.accountId === accountId),
      (update) => [update.contactId],
      (updates) => maxBy(updates, (update) => update.timestamp),
    )
      .filter((update) => !update.deleted)
      .map((update) => ({ contactId: update.contactId, name: update.name }));
  };
}

export function contactLatest({
  accountId,
  contactId,
}: {
  accountId: AccountId;
  contactId: AccountId;
}) {
  return (all: Array<DataItem>) => {
    const updates = all
      .filter((item) => item.type === "ContactUpdate")
      .filter(
        (update) =>
          update.accountId === accountId && update.contactId === contactId,
      );
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      if (!latestUpdate.deleted) return { name: latestUpdate.name };
    }
  };
}

export const getContact: MemitaQuery<
  { accountId: AccountId | undefined; contactId: AccountId | undefined },
  { name: string } | undefined
> =
  ({ accountId, contactId }) =>
  async ({ appStorage }) => {
    const current = await appStorage.read();
    const all = current.data;
    return contactLatest({ accountId: accountId!, contactId: contactId! })(all);
  };
