import { StoreItem } from "./Queries";

// TODO implement correctly

export function shouldSend(storeItem: StoreItem): boolean {
  if (storeItem.type === "ContactUpdate") {
    // quickfixz to not propagate accounts to other devices
    return false;
  }
  return true;
}
