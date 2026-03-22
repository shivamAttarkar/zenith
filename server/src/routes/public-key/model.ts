import { t, type UnwrapSchema } from "elysia";
import { db } from "../../db/model";

export const PublicKeyModel = {
  publicKeyBody: t.Pick(t.Object(db.insert.userPublicKey), ["publicKey"]),
  publicKeyResponse: t.Object(db.insert.userPublicKey),
  publicKeyError: t.Object({ message: t.String() }),
  publicKeyParameters: t.Pick(t.Object(db.insert.userPublicKey), [
    "userId",
    "publicKey",
  ]),
} as const;

export type PublicKeyModel = {
  [k in keyof typeof PublicKeyModel]: UnwrapSchema<(typeof PublicKeyModel)[k]>;
};
