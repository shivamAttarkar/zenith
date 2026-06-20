import { eq } from "drizzle-orm";
import { sqlite as db } from "$lib/db/sqlite";
import { users } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";
import { apiClient } from "$lib/utils/api";

const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export async function getContactPublicKey(contactId: string): Promise<string> {
  const [cached] = await db.select().from(users).where(eq(users.id, contactId));

  const isStale =
    !cached?.publicKey || Date.now() - cached.cachedAt > STALE_THRESHOLD_MS;
  if (!isStale) {
    return cached.publicKey!;
  }
  const { data, error } = await apiClient.api.v1.user({ id: contactId }).get();
  if (error || !data || !("publicKey" in data) || !data.publicKey) {
    if (cached?.publicKey) return cached.publicKey;
    throw new Error(`Public key unavailable for contact ${contactId}`);
  }

  await db
    .insert(users)
    .values({
      id: data.id,
      name: data.name,
      email: data.email,
      image: data.image ?? null,
      publicKey: data.publicKey,
      cachedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { publicKey: data.publicKey, cachedAt: Date.now() },
    });
  notifyChange("users", "update", { id: contactId });
  return data.publicKey;
}
