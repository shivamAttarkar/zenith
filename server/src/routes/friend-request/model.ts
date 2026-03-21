import { t, type UnwrapSchema } from "elysia";
import { db } from "../../db/model";

const authenticationResponse = t.Object({
  id: t.String(),
  rawId: t.String(),
  response: t.Object({
    clientDataJSON: t.String(),
    authenticatorData: t.String(),
    signature: t.String(),
    userHandle: t.Optional(t.String()),
  }),
  clientExtensionResults: t.Object({}, { additionalProperties: true }),
  type: t.Literal("public-key"),
});

const verificationOptionsResponse = t.Object({
  challenge: t.String(),
  timeout: t.Optional(t.Number()),
  rpId: t.Optional(t.String()),
  allowCredentials: t.Optional(
    t.Array(
      t.Object({
        id: t.String(),
        type: t.Literal("public-key"),
        transports: t.Optional(
          t.Array(
            t.Union([
              t.Literal("ble"),
              t.Literal("cable"),
              t.Literal("hybrid"),
              t.Literal("internal"),
              t.Literal("nfc"),
              t.Literal("smart-card"),
              t.Literal("usb"),
            ]),
          ),
        ),
      }),
    ),
  ),
  userVerification: t.Optional(
    t.Union([
      t.Literal("required"),
      t.Literal("preferred"),
      t.Literal("discouraged"),
    ]),
  ),
  hints: t.Optional(
    t.Array(
      t.Union([
        t.Literal("hybrid"),
        t.Literal("security-key"),
        t.Literal("client-device"),
      ]),
    ),
  ),
  extensions: t.Optional(t.Object({}, { additionalProperties: true })),
});

export const FriendRequestModel = {
  friendRequestParameters: t.Intersect([
    t.Pick(t.Object(db.select.friendRequest), ["id"]),
    t.Object({
      userId: t.String(),
      authenticationResponse,
    }),
  ]),
  friendRequestResponse: t.Object(db.select.friendRequest),
  friendRequestListResponse: t.Array(t.Object(db.select.friendRequest)),
  friendRequestAuthOptionsResponse: verificationOptionsResponse,
  friendRequestVerifyBody: t.Intersect([
    t.Pick(t.Object(db.select.friendRequest), ["id"]),
    t.Object({
      authenticationResponse: authenticationResponse,
    }),
  ]),
  friendRequestError: t.Object({ message: t.String() }),
} as const;

export type FriendRequestModel = {
  [k in keyof typeof FriendRequestModel]: UnwrapSchema<
    (typeof FriendRequestModel)[k]
  >;
};
