import { hkdfSync } from "node:crypto";
import {
  type AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { pg } from "../db/pg";
import { redisPub } from "../db/redis";
import { passkey, user } from "../db/schema";
import type { WsServerMessage } from "../ws/types";

export async function deriveChallenge(
  senderPublicKey: string,
  receiverPublicKey: string,
  requestId: string,
): Promise<string> {
  const seed = Buffer.concat([
    Buffer.from(senderPublicKey),
    Buffer.from(receiverPublicKey),
  ]);
  const challenge = hkdfSync("sha256", seed, requestId, "friend-request", 32);
  return Buffer.from(challenge).toString("base64url");
}

export const derivefriendRequestOptions = async ({
  challenge,
  userId,
}: {
  challenge: string;
  userId: string;
}) => {
  const rpID = Bun.env.RP_ID;
  const [userData] = await pg.select().from(user).where(eq(user.id, userId));

  if (!userData) {
    throw new Error("User doesn't exists");
  }

  const userPasskeys = await pg
    .select()
    .from(passkey)
    .where(eq(passkey.userId, userId));

  const options: PublicKeyCredentialRequestOptionsJSON =
    await generateAuthenticationOptions({
      rpID,
      allowCredentials: userPasskeys.map((passkey) => ({
        id: passkey.credentialID,
        transports:
          (passkey.transports?.split(",") as AuthenticatorTransportFuture[]) ??
          [],
      })),
      challenge: Buffer.from(challenge, "base64url"),
    });

  return options;
};

export const sendWSMessageToUser = async ({
  userId,
  msg,
}: {
  userId: string;
  msg: WsServerMessage;
}) => {
  const [userData] = await pg.select().from(user).where(eq(user.id, userId));
  if (!userData) {
    throw new Error("User doesn't exists");
  }
  const online = await redisPub.exists(`presence:${userId}`);
  const message = JSON.stringify(msg);
  if (online) {
    const res = await redisPub.publish(`msg:${userId}`, message);
    if (res === 0) {
      await redisPub.rpush(`queue:${userId}`, message);
    }
  } else {
    await redisPub.rpush(`queue:${userId}`, message);
  }
};
