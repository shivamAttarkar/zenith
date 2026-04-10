import { asc, eq } from 'drizzle-orm';
import { sqlite } from '$lib/db/sqlite';
import { message } from '$lib/db/schema';

type Message = typeof message.$inferSelect;

function createMessagesStore() {
  let data = $state<Message[]>([]);
  let conversationId = $state<string | null>(null);
  let loading = $state(false);

  async function open(id: string) {
    conversationId = id;
    loading = true;
    data = await sqlite.select().from(message).where(eq(message.conversationId, id)).orderBy(asc(message.ts));
    loading = false;
  }

  function push(msg: Message) {
    data.push(msg);
  }

  function close() {
    data = [];
    conversationId = null;
  }

  return {
    get data() { return data; },
    get loading() { return loading; },
    get conversationId() { return conversationId; },
    open,
    push,
    close
  };
}

export const messages = createMessagesStore();
