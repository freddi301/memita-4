import * as z from "zod";
import { AccountId, AccountIdSchema } from "../cryptography/cryptography";
import { groupBy, maxBy } from "./helpers";
import { StoreItem } from "./Queries";
import { nowTimestamp, TimestampSchema } from "./Timestamp";

export const ContactUpdateSchema = z.object({
  type: z.literal("ContactUpdate"),
  accountId: AccountIdSchema,
  contactId: AccountIdSchema,
  name: z.string(),
  deleted: z.boolean(),
  timestamp: TimestampSchema,
});

export type ContactUpdate = z.infer<typeof ContactUpdateSchema>;

export function updateContact({
  accountId,
  contactId,
  name,
  deleted,
}: {
  accountId: AccountId;
  contactId: AccountId;
  name: string;
  deleted: boolean;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "ContactUpdate",
        accountId,
        contactId,
        name,
        deleted,
        timestamp: nowTimestamp(),
      },
    ];
  };
}

export function contactList({ accountId }: { accountId: AccountId }) {
  return (all: Array<StoreItem>) => {
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
  contactId: AccountId | undefined;
}) {
  return (all: Array<StoreItem>) => {
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
