import { AccountId } from "../cryptography/cryptography";
import { DataItem } from "./Queries";

// TODO implement correctly

export type ShouldSendProps<StoreItem> = {
  thisAccountId: AccountId;
  otherAccountId: AccountId;
  storeItem: StoreItem;
};

export function shouldSend({
  thisAccountId,
  otherAccountId,
  storeItem,
}: ShouldSendProps<DataItem>): boolean {
  if (storeItem.type === "ContactUpdate") {
    if (
      thisAccountId === otherAccountId &&
      storeItem.accountId === thisAccountId
    ) {
      return true;
    }
  }
  if (storeItem.type === "DirectMessageUpdate") {
    if (
      storeItem.isDraft &&
      storeItem.senderId === thisAccountId &&
      thisAccountId === otherAccountId
    ) {
      return true;
    }
    if (!storeItem.isDraft) {
      if (
        (storeItem.senderId === thisAccountId &&
          storeItem.receiverId === otherAccountId) ||
        (storeItem.senderId === otherAccountId &&
          storeItem.receiverId === thisAccountId)
      ) {
        return true;
      }
    }
  }
  return false;
}
