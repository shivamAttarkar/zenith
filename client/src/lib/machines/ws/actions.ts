import type { WsMachineContext, WsMachineEvents } from './types';

type ActionArgs = { context: WsMachineContext; event: WsMachineEvents };

export const handleWsMessage = ({ event }: ActionArgs) => {
  if (event.type !== 'WS_MESSAGE') return;
  switch (event.data.type) {
    case 'chat': {
      const { senderId, receiverId } = event.data;
      const conversationId = [senderId, receiverId].sort().toString();
      console.log(conversationId, event.data.payload.msg);
      break;
    }
    case 'friend-request': {
      break;
    }
    case 'friend-request-accepted': {
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
