import { assign, sendTo, setup } from 'xstate';
import { websocketActor } from './actors';
import { handleWsMessage } from './actions';
import type { WsMachineContext, WsMachineEvents } from './types';

const BASE_DELAY = 1_000;
const MAX_DELAY = 64_000;

function nextDelay(retryCount: number): number {
  return Math.min(BASE_DELAY * 2 ** retryCount, MAX_DELAY) + Math.random() * 1_000;
}

const WsMachineSetup = setup({
  types: {
    context: {} as WsMachineContext,
    events: {} as WsMachineEvents
  },
  actors: { websocketActor },
  delays: {
    RETRY_DELAY: ({ context }: { context: WsMachineContext }) => context.retryDelay
  },
  actions: {
    incrementRetry: assign(({ context }) => ({
      retryCount: context.retryCount + 1,
      retryDelay: nextDelay(context.retryCount + 1)
    })),
    resetRetry: assign({
      retryCount: 0,
      retryDelay: BASE_DELAY
    }),
    handleWsMessage
  },
  guards: {
    isAuthError: (_, params: { code: number }) => params.code === 4001
  }
});

export const WsMachine = WsMachineSetup.createMachine({
  id: 'ws',
  initial: 'active',
  context: {
    retryCount: 0,
    retryDelay: BASE_DELAY
  },
  states: {
    active: {
      invoke: { id: 'wsActor', src: 'websocketActor' },
      initial: 'connecting',
      states: {
        connecting: {
          on: {
            WS_OPEN: { target: 'connected', actions: 'resetRetry' }
          }
        },
        connected: {
          tags: ['connected'],
          on: {
            SEND: { actions: sendTo('wsActor', ({ event }) => event) },
            DISCONNECT: '#ws.disconnected',
            WS_MESSAGE: { actions: 'handleWsMessage' }
          }
        }
      },
      on: {
        WS_CLOSE: [
          {
            target: 'error',
            guard: { type: 'isAuthError', params: ({ event }) => ({ code: event.code }) }
          },
          { target: 'disconnected', actions: 'incrementRetry' }
        ],
        WS_ERROR: { target: 'disconnected', actions: 'incrementRetry' }
      }
    },
    disconnected: {
      after: {
        RETRY_DELAY: { target: 'active' }
      },
      on: {
        RETRY: { target: 'active', actions: 'resetRetry' }
      }
    },
    error: {
      type: 'final'
    }
  }
});
