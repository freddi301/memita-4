import { ArticleUpdate } from "./articles";
import { BiographyUpdate } from "./biography";
import { ContactUpdate } from "./contacts";
import {
  DidReadDirectMessageUpdate,
  DirectMessageUpdate,
} from "./directMessages";
import { GroupMessageUpdate } from "./groupMessages";
import { GroupUpdate } from "./groups";

export type StoreItem =
  | ContactUpdate
  | DirectMessageUpdate
  | DidReadDirectMessageUpdate
  | GroupUpdate
  | GroupMessageUpdate
  | ArticleUpdate
  | BiographyUpdate;
