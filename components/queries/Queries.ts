import { AccountUpdate } from "./accounts";
import { ArticleUpdate } from "./articles";
import { BiographyUpdate } from "./biography";
import { ContactUpdate } from "./contacts";
import { DirectMessageUpdate } from "./directMessages";
import { GroupMessageUpdate } from "./groupMessages";
import { GroupUpdate } from "./groups";

export type Root = {
  accounts: Array<AccountUpdate>;
  contacts: Array<ContactUpdate>;
  directMessages: Array<DirectMessageUpdate>;
  groups: Array<GroupUpdate>;
  groupMessages: Array<GroupMessageUpdate>;
  articles: Array<ArticleUpdate>;
  biographies: Array<BiographyUpdate>;
};

export const initialRoot: Root = {
  accounts: [],
  contacts: [],
  directMessages: [],
  groups: [],
  groupMessages: [],
  articles: [],
  biographies: [],
};
