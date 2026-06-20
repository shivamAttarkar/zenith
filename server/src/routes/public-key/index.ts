import { and, eq, or } from "drizzle-orm";
import { Elysia } from "elysia";
import { pg } from "../../db/pg";
import { friendRequest } from "../../db/schema";
import { redisPub } from "../../db/redis";
import { authPlugin } from "../../lib/auth";
import { PublicKeyModel } from "./model";
import { PublicKeyService } from "./service";

export const publicKeyRoutes = new Elysia({
  tags: ["public-key"],
  prefix: "/public-key",
})
  .use(authPlugin)
  .get("/", ({ user }) => PublicKeyService.get({ userId: user.id }), {
    auth: true,
    response: {
      200: PublicKeyModel.publicKeyResponse,
      404: PublicKeyModel.publicKeyError,
    },
  })
  .post(
    "/",
    ({ user, body }) =>
      PublicKeyService.create({ userId: user.id, publicKey: body.publicKey }),
    {
      auth: true,
      body: PublicKeyModel.publicKeyBody,
      response: {
        200: PublicKeyModel.publicKeyResponse,
        409: PublicKeyModel.publicKeyError,
        500: PublicKeyModel.publicKeyError,
      },
    },
  )
  .put(
    "/",
    async ({ user, body }) => {
      const result = await PublicKeyService.update({
        userId: user.id,
        publicKey: body.publicKey,
      });

      if ("publicKey" in result) {
        const friends = await pg
          .select()
          .from(friendRequest)
          .where(
            and(
              eq(friendRequest.status, "accepted"),
              or(
                eq(friendRequest.senderId, user.id),
                eq(friendRequest.receiverId, user.id),
              ),
            ),
          );

        const msg = JSON.stringify({
          type: "public-key-updated",
          userId: user.id,
          publicKey: body.publicKey,
        });

        await Promise.all(
          friends.map(async (fr) => {
            const friendId =
              fr.senderId === user.id ? fr.receiverId : fr.senderId;
            const online = await redisPub.exists(`presence:${friendId}`);
            if (online) {
              await redisPub.publish(`msg:${friendId}`, msg);
            } else {
              await redisPub.rpush(`queue:${friendId}`, msg);
            }
          }),
        );
      }

      return result;
    },
    {
      auth: true,
      body: PublicKeyModel.publicKeyBody,
      response: {
        200: PublicKeyModel.publicKeyResponse,
        404: PublicKeyModel.publicKeyError,
      },
    },
  )
  .delete("/", ({ user }) => PublicKeyService.delete({ userId: user.id }), {
    auth: true,
    response: {
      200: PublicKeyModel.publicKeyResponse,
      404: PublicKeyModel.publicKeyError,
    },
  });
