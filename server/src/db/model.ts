import * as table from "./schema";
import { spreads } from "./utils";

export const db = {
  insert: spreads(
    {
      user: table.user,
      userPublicKey: table.userPublicKey,
      friendRequest: table.friendRequest,
    },
    "insert",
  ),
  select: spreads(
    {
      user: table.user,
      userPublicKey: table.userPublicKey,
      friendRequest: table.friendRequest,
    },
    "select",
  ),
} as const;
