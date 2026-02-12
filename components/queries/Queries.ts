import { AccountUpdate } from "./accounts";
import { ArticleUpdate } from "./articles";
import { ContactUpdate } from "./contacts";

export type Root = {
  accounts: Array<AccountUpdate>;
  contacts: Array<ContactUpdate>;
  articles: Array<ArticleUpdate>;
};

export const initialRoot: Root = {
  accounts: [],
  contacts: [],
  articles: [],
};
