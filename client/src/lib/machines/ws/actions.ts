import { appMachine } from '$lib/machines';
import { sqlite } from '$lib/db/sqlite';
import { conversation } from '$lib/db/schema';
import { friendRequests } from '$lib/stores/friendRequests.svelte';
import type { WsMachineContext, WsMachineEvents } from './types';

type ActionArgs = { context: WsMachineContext; event: WsMachineEvents };

export const handleWsMessage = ({ event }: ActionArgs) => {
  if (event.type !== 'WS_MESSAGE') return;
  switch (event.data.type) {
    case 'chat': {
      break;
    }
    case 'friend-request': {
      break;
    }
    case 'friend-request-accepted': {
      const currentUserId = appMachine.getSnapshot().context.session!.user.id;
      const [user1Id, user2Id] = [currentUserId, event.data.otherUserId].sort();
      sqlite
        .insert(conversation)
        .values({ id: [user1Id, user2Id].join('_'), user1Id, user2Id })
        .onConflictDoNothing()
        .then(() => friendRequests.invalidate());
      break;
    }
    case 'friend-request-rejected': {
      break;
    }
    case 'friend-request-deleted': {
      break;
    }
    case 'error': {
      break;
    }
  }
};
