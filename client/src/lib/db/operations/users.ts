import { sqlite as db } from "$lib/db/sqlite";
import { users } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";
import { apiClient } from "$lib/utils/api";

export async function upsertUser(user: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  publicKey?: string | null;
}): Promise<void> {
  await db
    .insert(users)
    .values({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      publicKey: user.publicKey ?? null,
      cachedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        publicKey: user.publicKey ?? null,
        cachedAt: Date.now(),
      },
    });
  notifyChange("users", "upsert", { id: user.id });
}

export async function upsertUserById(userId: string): Promise<void> {
  const { data, error } = await apiClient.api.v1.user({ id: userId }).get();
  if (error) {
    return;
  }
  await db
    .insert(users)
    .values({
      id: data.id,
      name: data.name,
      email: data.email,
      image: data.image ?? null,
      publicKey: data.publicKey ?? null,
      cachedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: data.name,
        email: data.email,
        image: data.image ?? null,
        publicKey: data.publicKey ?? null,
        cachedAt: Date.now(),
      },
    });
  notifyChange("users", "upsert", { id: userId });
}
