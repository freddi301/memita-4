import { AccountUpdate } from "./accounts";
import { ArticleUpdate } from "./articles";
import { ContactUpdate } from "./contacts";
import { DirectMessageUpdate } from "./directMessages";

export type Root = {
  accounts: Array<AccountUpdate>;
  contacts: Array<ContactUpdate>;
  messages: Array<DirectMessageUpdate>;
  articles: Array<ArticleUpdate>;
};

export const initialRoot: Root = {
  accounts: [],
  contacts: [],
  messages: [],
  articles: [],
};
