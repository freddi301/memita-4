import * as z from "zod";
import { groupBy, maxBy } from "./helpers";
import { StoreItem } from "./Queries";

export const ContactUpdateSchema = z.object({
  type: z.literal("ContactUpdate"),
  accountId: z.string(),
  contactId: z.string(),
  name: z.string(),
  deleted: z.boolean(),
  timestamp: z.number(),
});

export type ContactUpdate = z.infer<typeof ContactUpdateSchema>;

export function updateContact({
  accountId,
  contactId,
  name,
  deleted,
}: {
  accountId: string;
  contactId: string;
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
        timestamp: Date.now(),
      },
    ];
  };
}

export function contactList({ accountId }: { accountId: string }) {
  return (all: Array<StoreItem>) => {
    return groupBy(
      all
        .filter((item) => item.type === "ContactUpdate")
        .filter((update) => update.accountId === accountId),
      (update) => [update.contactId],
      (updates) => maxBy(updates, (update) => update.timestamp),
    )
      .filter((update) => !update.deleted)
      .map((update) => ({
        contactId: update.contactId,
        name: update.name,
      }));
  };
}

export function contactLatest({
  accountId,
  contactId,
}: {
  accountId: string;
  contactId: string;
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
