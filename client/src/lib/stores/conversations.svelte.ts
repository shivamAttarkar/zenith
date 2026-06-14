import { and, eq, inArray, max, or } from 'drizzle-orm';
import { appMachine } from '$lib/machines';
import { sqlite } from '$lib/db/sqlite';
import { conversation, message, user } from '$lib/db/schema';

type Message = typeof message.$inferSelect;

type ConversationItem = {
  id: string;
  otherUser: { id: string; name: string; image: string | null };
  lastMessage: Pick<Message, 'id' | 'senderId' | 'payload' | 'format' | 'ts'> | null;
  createdAt: Date;
};

function createConversationsStore() {
  let data = $state<ConversationItem[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function load() {
    loading = true;
    error = null;

    try {
      const currentUserId = appMachine.getSnapshot().context.session!.user.id;

      const conversations = await sqlite
        .select()
        .from(conversation)
        .where(
          or(eq(conversation.user1Id, currentUserId), eq(conversation.user2Id, currentUserId))
        );

      if (conversations.length === 0) {
        data = [];
        return;
      }

      const otherUserIds = conversations.map((c) =>
        c.user1Id === currentUserId ? c.user2Id : c.user1Id
      );

      const sq = sqlite
        .select({ conversationId: message.conversationId, maxTs: max(message.ts).as('max_ts') })
        .from(message)
        .where(
          inArray(
            message.conversationId,
            conversations.map((c) => c.id)
          )
        )
        .groupBy(message.conversationId)
        .as('sq');

      const [users, lastMessages] = await Promise.all([
        sqlite.select().from(user).where(inArray(user.id, otherUserIds)),
        sqlite
          .select({
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            payload: message.payload,
            format: message.format,
            ts: message.ts
          })
          .from(message)
          .innerJoin(
            sq,
            and(eq(message.conversationId, sq.conversationId), eq(message.ts, sq.maxTs))
          )
      ]);

      const userMap = new Map(users.map((u) => [u.id, u]));
      const lastMessageMap = new Map(lastMessages.map((m) => [m.conversationId, m]));

      data = conversations.map((c) => {
        const otherUserId = c.user1Id === currentUserId ? c.user2Id : c.user1Id;
        const otherUser = userMap.get(otherUserId)!;
        return {
          id: c.id,
          createdAt: c.createdAt,
          otherUser: { id: otherUserId, name: otherUser.name, image: otherUser.image },
          lastMessage: lastMessageMap.get(c.id) ?? null
        };
      });
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  return {
    get data() {
      return data;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    load,
    invalidate: load
  };
}

export const conversations = createConversationsStore();
