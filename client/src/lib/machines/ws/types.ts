import type { WsClientMessage, WsServerMessage } from '../../../../../server/src/ws/types';

export type { WsClientMessage, WsServerMessage };

export type WsMachineContext = {
  retryCount: number;
  retryDelay: number;
};

export type WsMachineEvents =
  | { type: 'SEND'; message: WsClientMessage }
  | { type: 'DISCONNECT' }
  | { type: 'RETRY' }
  | { type: 'WS_OPEN' }
  | { type: 'WS_CLOSE'; code: number }
  | { type: 'WS_ERROR' }
  | { type: 'WS_MESSAGE'; data: WsServerMessage };
