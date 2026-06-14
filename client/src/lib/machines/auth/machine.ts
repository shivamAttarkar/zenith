import { authClient } from "$lib/utils/auth";
import { assertEvent, assign, fromPromise, setup } from "xstate";

const authSetup = setup({
  types: {
    context: {} as {
      error?: string;
      loading: boolean;
    },
    events: {} as
      | { type: "login"; email: string; password: string }
      | { type: "signup"; email: string; name: string; password: string }
      | { type: "passkey" },
  },
  actors: {
    loginWithEmail: fromPromise(
      async ({ input }: { input: { email: string; password: string } }) => {
        const res = await authClient.signIn.email({
          email: input.email,
          password: input.password,
        });
        if (res.error) {
          throw res.error.message;
        } else {
          return res.data;
        }
      },
    ),
    loginWithPasskey: fromPromise(async () => {
      const res = await authClient.signIn.passkey();
      if (res.error) {
        throw res.error.message;
      } else {
        return res.data;
      }
    }),
    signupWithEmail: fromPromise(
      async ({
        input,
      }: {
        input: { email: string; password: string; name: string };
      }) => {
        const res = await authClient.signUp.email({
          email: input.email,
          name: input.name,
          password: input.password,
        });
        if (res.error) {
          throw res.error.message;
        } else {
          return res.data;
        }
      },
    ),
  },
  actions: {},
});

export const authMachine = authSetup.createMachine({
  id: "auth",
  initial: "unauthorized",
  context: { loading: false },
  states: {
    unauthorized: {
      entry: assign({ loading: false }),
      exit: assign({ loading: true }),
      on: {
        login: { target: "loggingIn" },
        signup: { target: "signingUp" },
        passkey: { target: "passkeyAuth" },
      },
    },
    loggingIn: {
      invoke: {
        src: "loginWithEmail",
        input: ({ event }) => {
          assertEvent(event, "login");
          return { email: event.email, password: event.password };
        },
        onDone: { target: "authorized" },
        onError: {
          target: "unauthorized",
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
    },
    signingUp: {
      invoke: {
        src: "signupWithEmail",
        input: ({ event }) => {
          assertEvent(event, "signup");
          return {
            email: event.email,
            name: event.name,
            password: event.password,
          };
        },
        onDone: { target: "authorized" },
        onError: {
          target: "unauthorized",
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    passkeyAuth: {
      invoke: {
        src: "loginWithPasskey",
        onDone: { target: "authorized" },
        onError: {
          target: "unauthorized",
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    authorized: {
      type: "final",
      entry: assign({ loading: false, error: undefined }),
    },
  },
});
