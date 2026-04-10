import { fromCallback } from 'xstate';
import { config } from '$lib/config';
import type { WsClientMessage, WsServerMessage } from './types';

const wsUrl = config.backendURL.replace(/^http/, 'ws') + '/ws/chat';

export const websocketActor = fromCallback<{ type: 'SEND'; message: WsClientMessage }>(
  ({ sendBack, receive }) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      sendBack({ type: 'WS_OPEN' });
    };
    ws.onclose = (e) => {
      sendBack({ type: 'WS_CLOSE', code: e.code });
    };
    ws.onerror = () => {
      sendBack({ type: 'WS_ERROR' });
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WsServerMessage;
        sendBack({ type: 'WS_MESSAGE', data });
      } catch {
        // ignore malformed messages
      }
    };
    receive((event) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event.message));
      }
    });
    return () => ws.close();
  }
);
