import { assign, setup } from 'xstate';
import * as PasskeyActors from './actors';
import { BetterFetchError } from '@better-fetch/fetch';
import { generic_error } from '$lib/constants';
import type { PasskeyContext, PasskeyEvents } from './types';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';

const passkeySetup = setup({
  types: {
    context: {} as PasskeyContext,
    events: {} as PasskeyEvents
  },
  actors: PasskeyActors,
  actions: {
    gotoPasskey: () => {
      if (page.url.pathname !== '/auth/passkey') {
        goto(resolve('/auth/passkey'));
      }
    },
    setError: assign({
      error: (_, params: { message: string }) => params.message
    }),
    clearError: assign({ error: null })
  }
});

export const PasskeyMachine = passkeySetup.createMachine({
  id: 'PasskeyMachine',
  context: { error: null },
  initial: 'checkPasskey',
  states: {
    checkPasskey: {
      invoke: {
        src: 'checkPasskey',
        onDone: [
          { target: 'passkeyRegistered', guard: ({ event }) => event.output },
          { target: 'registerPasskeyPage' }
        ],
        onError: {
          target: 'checkFailed',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    },
    checkFailed: {
      entry: 'gotoPasskey',
      on: {
        retry: { target: 'checkPasskey', actions: 'clearError' }
      }
    },
    registerPasskeyPage: {
      entry: 'gotoPasskey',
      on: {
        registerPasskey: { target: 'registeringPasskey', actions: 'clearError' },
        useExistingPasskey: { target: 'authenticatingWithPasskey', actions: 'clearError' }
      }
    },
    registeringPasskey: {
      invoke: {
        src: 'registerPasskey',
        onDone: { target: 'passkeyRegistered' },
        onError: {
          target: 'registerPasskeyPage',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    },
    authenticatingWithPasskey: {
      invoke: {
        src: 'passkeyLogin',
        onDone: { target: 'passkeyRegistered' },
        onError: {
          target: 'registerPasskeyPage',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    },
    passkeyRegistered: {
      type: 'final'
    }
  }
});
