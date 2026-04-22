import { hexToBytes } from "@noble/hashes/utils.js";
import { generateKeyPair } from "../cryptography";
import { groupBy, maxBy } from "./helpers";
import { StoreItem } from "./Queries";

export function createAccountId() {
  return generateKeyPair().publicKey;
}

export function validateAccountId(accountId: string) {
  try {
    if (hexToBytes(accountId).length !== 32) {
      throw new Error("Invalid accountId length");
    }
    return true;
  } catch {
    return false;
  }
}

export function updateAccount({
  accountId,
  name,
  deleted,
}: {
  accountId: string;
  name: string;
  deleted: boolean;
}) {
  return (all: Array<StoreItem>): Array<StoreItem> => {
    return [
      {
        type: "ContactUpdate",
        accountId,
        contactId: accountId,
        name,
        deleted,
        timestamp: Date.now(),
      },
    ];
  };
}

export function accountList() {
  return (all: Array<StoreItem>) => {
    return groupBy(
      all
        .filter((item) => item.type === "ContactUpdate")
        .filter((update) => update.accountId === update.contactId),
      (update) => [update.accountId],
      (updates) => maxBy(updates, (update) => update.timestamp),
    )
      .filter((update) => !update.deleted)
      .map((update) => ({
        accountId: update.accountId,
        name: update.name,
      }));
  };
}

export function accountLatest({ accountId }: { accountId: string }) {
  return (all: Array<StoreItem>) => {
    const udpates = all
      .filter((item) => item.type === "ContactUpdate")
      .filter(
        (update) =>
          update.accountId === accountId && update.contactId === accountId,
      );
    if (udpates.length) {
      const latestUpdate = maxBy(udpates, (update) => update.timestamp);
      if (!latestUpdate.deleted) return { name: latestUpdate.name };
    }
  };
}
