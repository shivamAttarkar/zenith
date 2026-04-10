import { assign, setup } from 'xstate';
import * as AppActors from './actors';
import type { AppContext, AppEvents } from './types';
import { AuthMachine } from '$lib/machines/auth/machine';
import { PasskeyMachine } from '$lib/machines/passkey/machine';
import { BetterFetchError } from '@better-fetch/fetch';
import { generic_error } from '$lib/constants';

const AppMachineSetup = setup({
  types: {
    context: {} as AppContext,
    events: {} as AppEvents
  },
  actors: {
    ...AppActors,
    AuthMachine,
    PasskeyMachine
  },
  actions: {
    setError: assign({
      error: (_, params: { message: string }) => params.message
    }),
    clearError: assign({ error: null })
  }
});

export const AppMachine = AppMachineSetup.createMachine({
  id: 'app',
  initial: 'initialize',
  context: {
    session: null,
    error: null
  },
  states: {
    hist: { type: 'history' },
    error: {
      on: {
        retry: { target: 'hist', actions: 'clearError' }
      }
    },
    initialize: {
      invoke: {
        src: 'initializeApp',
        onDone: { target: 'loadSession' },
        onError: {
          target: 'error',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    },
    loadSession: {
      invoke: {
        src: 'getSession',
        onDone: [
          {
            actions: assign(({ event }) => ({
              session: event.output
            })),
            target: 'configureECDHKeys',
            guard: ({ event }) => event.output !== null
          },
          {
            target: 'unAuthenticated'
          }
        ],
        onError: {
          target: 'error',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    },
    unAuthenticated: {
      invoke: {
        id: 'AuthMachine',
        src: 'AuthMachine',
        onDone: { target: 'loadSession' }
      }
    },
    configureECDHKeys: {
      invoke: {
        src: 'setECDHKeys',
        onDone: { target: 'configurePasskey' },
        onError: {
          target: 'error',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    },
    configurePasskey: {
      invoke: {
        id: 'PasskeyMachine',
        src: 'PasskeyMachine',
        onDone: { target: 'idle' }
      }
    },
    idle: {
      invoke: { src: 'sessionWatcher' },
      on: { logout: 'loggingOut' }
    },
    loggingOut: {
      invoke: {
        src: 'logout',
        onDone: {
          target: 'unAuthenticated',
          actions: assign({ session: null })
        },
        onError: {
          target: 'error',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    }
  }
});
