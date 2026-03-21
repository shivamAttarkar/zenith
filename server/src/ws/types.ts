import { t } from "elysia";

const WsChatPayload = t.Union([
  t.Object({ format: t.Literal("string"), msg: t.String() }),
  t.Object({
    format: t.Literal("binary"),
    msg: t.String({ contentEncoding: "base64" }),
  }),
]);

const WsChatMessage = t.Object({
  type: t.Literal("chat"),
  id: t.String(),
  ts: t.Number(),
  senderId: t.String(),
  receiverId: t.String(),
  payload: WsChatPayload,
});

/**
 * Messages sent from the client to the server.
 *
 * @remarks
 * `chat` — send a message to another user
 */
export const WsClientMessage = t.Union([WsChatMessage]);

/**
 * Messages sent from the server to the client.
 *
 * @remarks
 * - `chat` — deliver a chat message from another user
 * - `friend-request` — notify the client of an incoming friend request
 * - `friend-request-accepted` - notify the client when a friend request is accepted
 * - `friend-request-rejected` - notify the client when a friend request is rejected
 * - `friend-request-deleted` - notify the client when a friend request is deleted
 * - `error` — notify the client of an error
 */
export const WsServerMessage = t.Union([
  WsChatMessage,
  t.Object({
    type: t.Literal("friend-request"),
    senderId: t.String(),
    friendRequestId: t.String(),
  }),
  t.Object({
    type: t.Literal("friend-request-accepted"),
    friendRequestId: t.String(),
  }),
  t.Object({
    type: t.Literal("friend-request-rejected"),
    friendRequestId: t.String(),
  }),
  t.Object({
    type: t.Literal("friend-request-deleted"),
    friendRequestId: t.String(),
  }),
  t.Object({
    type: t.Literal("error"),
    error: t.Object({
      code: t.String(),
      message: t.String(),
    }),
  }),
]);

export type WsClientMessage = typeof WsClientMessage.static;
export type WsServerMessage = typeof WsServerMessage.static;
