import { assertEvent, assign, setup } from 'xstate';
import { BetterFetchError } from '@better-fetch/fetch';
import * as AuthActors from './actors';
import type { AuthContext, AuthEvents } from './types';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { generic_error } from '$lib/constants';
import { page } from '$app/state';

const AuthMachineSetup = setup({
  types: {
    context: {} as AuthContext,
    events: {} as AuthEvents
  },
  actors: AuthActors,
  actions: {
    gotoLogin: () => {
      if (page.url.pathname !== '/auth/login') {
        goto(resolve('/auth/login'));
      }
    },
    gotoSignup: () => {
      if (page.url.pathname !== '/auth/signup') {
        goto(resolve('/auth/signup'));
      }
    },
    setError: assign({
      error: (_, params: { message: string }) => params.message
    }),
    clearError: assign({ error: null })
  }
});

export const AuthMachine = AuthMachineSetup.createMachine({
  id: 'AuthMachine',
  context: { error: null },
  initial: 'loginPage',
  states: {
    loginPage: {
      entry: 'gotoLogin',
      on: {
        login: { target: 'loggingIn', actions: 'clearError' },
        moveToSignup: 'signupPage',
        loginWithPasskey: { target: 'authenticatingWithPasskey', actions: 'clearError' }
      }
    },
    loggingIn: {
      invoke: {
        src: 'emailLogin',
        input: ({ event }) => {
          assertEvent(event, 'login');
          return event;
        },
        onDone: { target: 'authenticated' },
        onError: {
          target: 'loginPage',
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
        onDone: { target: 'authenticated' },
        onError: {
          target: 'loginPage',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    },
    signupPage: {
      entry: 'gotoSignup',
      on: {
        signup: { target: 'signingUp', actions: 'clearError' },
        moveToLogin: 'loginPage'
      }
    },
    signingUp: {
      invoke: {
        src: 'emailSignup',
        input: ({ event }) => {
          assertEvent(event, 'signup');
          return event;
        },
        onDone: { target: 'authenticated' },
        onError: {
          target: 'signupPage',
          actions: {
            type: 'setError',
            params: ({ event }) => ({
              message: (event.error as BetterFetchError)?.message ?? generic_error
            })
          }
        }
      }
    },
    authenticated: { type: 'final' }
  }
});
