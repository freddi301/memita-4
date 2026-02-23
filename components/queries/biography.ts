import { collection } from "../persistance/helpers";
import { contactList } from "./contacts";
import { Root } from "./queries";

export type BiographyUpdate = {
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
  return (root: Root): Root => {
    return {
      ...root,
      biographies: root.biographies.concat([
        {
          accountId,
          location,
          content,
          timestamp: Date.now(),
        },
      ]),
    };
  };
}

export function biographyLatest({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return collection(root.biographies)
      .filter((update) => update.accountId === accountId)
      .maxBy((update) => update.timestamp)
      .map((update) => ({
        location: update.location,
        content: update.content,
      }));
  };
}

export function biographies({ accountId }: { accountId: string }) {
  return (root: Root) => {
    return contactList({ accountId })(root).flatMap((contact) => {
      return biographyLatest({ accountId: contact.contactId })(root).map(
        (biography) => ({
          contactId: contact.contactId,
          contactName: contact.name,
          content: biography.content,
          location: biography.location,
        })
      );
    });
  };
}
