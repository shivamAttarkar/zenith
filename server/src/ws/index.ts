import { Elysia, t } from "elysia";
import { auth } from "../lib/auth";
import { redisPub, redisSub } from "../db/redis";

const activeSubs = new Map<
  string,
  { handler: (msg: string) => void; heartbeat: NodeJS.Timeout }
>();

export const webSocketPlugin = new Elysia({ name: "websocket" })
  .resolve(async ({ status, request: { headers } }) => {
    const session = await auth.api.getSession({ headers });
    if (!session) return status(401);
    return { user: session.user };
  })
  .ws("/ws/chat", {
    body: t.Object({
      type: t.Literal("chat"),
      receiverId: t.String(),
      msg: t.String(),
    }),
    response: t.Object({
      type: t.Literal("chat"),
      senderId: t.String(),
      msg: t.String(),
    }),
    open: async (ws) => {
      const user = ws.data.user;

      await redisPub.set(`presence:${user.id}`, "1");
      await redisPub.expire(`presence:${user.id}`, 60);
      const heartbeat = setInterval(() => {
        redisPub.send("SETEX", [`presence:${user.id}`, "60", "1"]);
      }, 25_000);

      const handler = (msg: string) => {
        ws.send(JSON.parse(msg));
      };
      await redisSub.subscribe(`msg:${user.id}`, handler);
      activeSubs.set(ws.id, { handler, heartbeat });

      const pendingMessages = await redisPub.lrange(`queue:${user.id}`, 0, -1);
      for (const msg of pendingMessages) ws.send(JSON.parse(msg));
      await redisPub.del(`queue:${user.id}`);
    },
    message: async (ws, body) => {
      if (body.type == "chat") {
        const user = ws.data.user;
        const online = await redisPub.exists(`presence:${body.receiverId}`);
        const res = { type: "chat", senderId: user.id, msg: body.msg } as const;
        if (online) {
          await redisPub.publish(`msg:${body.receiverId}`, JSON.stringify(res));
        } else {
          await redisPub.rpush(`queue:${body.receiverId}`, JSON.stringify(res));
        }
      }
    },
    close: async (ws) => {
      const user = ws.data.user;

      const sub = activeSubs.get(ws.id);
      if (sub) {
        clearInterval(sub.heartbeat);
        await redisSub.unsubscribe(`msg:${user.id}`, sub.handler);
        activeSubs.delete(ws.id);
      }

      await redisPub.del(`presence:${user.id}`);
    },
  });
