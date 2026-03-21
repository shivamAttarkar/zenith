import * as table from "./schema";
import { spreads } from "./utils";

export const db = {
  insert: spreads(
    {
      user: table.user,
      userPublicKey: table.userPublicKey,
    },
    "insert",
  ),
  select: spreads(
    {
      user: table.user,
      userPublicKey: table.userPublicKey,
    },
    "select",
  ),
} as const;
