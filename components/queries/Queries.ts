import * as z from "zod";
import { ArticleUpdateSchema } from "./articles";
import { BiographyUpdateSchema } from "./biography";
import { ContactUpdateSchema } from "./contacts";
import {
  DidReadDirectMessageUpdateSchema,
  DirectMessageUpdateSchema,
} from "./directMessages";
import { GroupMessageUpdateSchema } from "./groupMessages";
import { GroupUpdateSchema } from "./groups";

export const StoreItemSchema = z.discriminatedUnion("type", [
  ContactUpdateSchema,
  DirectMessageUpdateSchema,
  DidReadDirectMessageUpdateSchema,
  GroupUpdateSchema,
  GroupMessageUpdateSchema,
  ArticleUpdateSchema,
  BiographyUpdateSchema,
]);

export type StoreItem = z.infer<typeof StoreItemSchema>;
