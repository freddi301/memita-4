import * as z from "zod";
import { AccountId, AccountIdSchema } from "../cryptography/cryptography";
import { DataItem } from "./Queries";
import { nowTimestamp, TimestampSchema } from "./Timestamp";
import { contactList } from "./contacts";
import { maxBy } from "./helpers";

const BioLocationSchema = z
  .object({ latitude: z.number(), longitude: z.number() })
  .optional();

export const BiographyUpdateSchema = z.object({
  type: z.literal("BiographyUpdate"),
  accountId: AccountIdSchema,
  location: BioLocationSchema,
  content: z.string(),
  timestamp: TimestampSchema,
});

type BioLocation = z.infer<NonNullable<typeof BioLocationSchema>>;

export function updateBiography({
  accountId,
  location,
  content,
}: {
  accountId: AccountId;
  location: BioLocation | undefined;
  content: string;
}) {
  return (all: Array<DataItem>): Array<DataItem> => {
    return [
      {
        type: "BiographyUpdate",
        accountId,
        location,
        content,
        timestamp: nowTimestamp(),
      },
    ];
  };
}

export function biographyLatest({ accountId }: { accountId: AccountId }) {
  return (all: Array<DataItem>) => {
    const updates = all
      .filter((item) => item.type === "BiographyUpdate")
      .filter((update) => update.accountId === accountId);
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      return { location: latestUpdate.location, content: latestUpdate.content };
    }
  };
}

export function biographies({ accountId }: { accountId: AccountId }) {
  return (all: Array<DataItem>) => {
    const contacts = contactList({ accountId })(all);
    return contacts.flatMap((contact) => {
      const biography = biographyLatest({ accountId: contact.contactId })(all);
      if (biography) {
        return [
          {
            contactId: contact.contactId,
            contactName: contact.name,
            content: biography.content,
            location: biography.location,
          },
        ];
      }
      return [];
    });
  };
}
