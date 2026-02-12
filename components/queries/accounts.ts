export type AccountUpdate = {
  id: string;
  name: string;
  deleted: boolean;
  timestamp: number;
};
export type ContactUpdate = {
  accountId: string;
  contactId: string;
  name: string;
  deleted: boolean;
  timestamp: number;
};
