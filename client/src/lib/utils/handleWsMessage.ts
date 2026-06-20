import { eq } from "drizzle-orm";
import { sqlite as db } from "$lib/db/sqlite";
import { users } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";

export async function handleWsMessage(msg: Record<string, unknown>) {
  switch (msg.type) {
    case "public-key-updated": {
      const { userId, publicKey } = msg as {
        userId: string;
        publicKey: string;
      };
      await db
        .update(users)
        .set({ publicKey, cachedAt: Date.now() })
        .where(eq(users.id, userId));
      notifyChange("users", "update", { id: userId });
      break;
    }
  }
}
