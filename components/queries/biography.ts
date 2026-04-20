import { StoreItem } from "./Queries";
import { contactList } from "./contacts";
import { maxBy } from "./helpers";

export type BiographyUpdate = {
  type: "BiographyUpdate";
  accountId: string;
  location: BioLocation | undefined;
  content: string;
  timestamp: number;
};

type BioLocation = {
  latitude: number;
  longitude: number;
  // address: string;
};

export function updateBiography({
  accountId,
  location,
  content,
}: {
  accountId: string;
  location: BioLocation | undefined;
  content: string;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "BiographyUpdate",
        accountId,
        location,
        content,
        timestamp: Date.now(),
      },
    ];
  };
}

export function biographyLatest({ accountId }: { accountId: string }) {
  return (all: Array<StoreItem>) => {
    const updates = all
      .filter((item) => item.type === "BiographyUpdate")
      .filter((update) => update.accountId === accountId);
    if (updates.length) {
      const latestUpdate = maxBy(updates, (update) => update.timestamp);
      return {
        location: latestUpdate.location,
        content: latestUpdate.content,
      };
    }
  };
}

export function biographies({ accountId }: { accountId: string }) {
  return (all: Array<StoreItem>) => {
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
