import { authClient } from "$lib/utils/auth";
import { store } from "$lib/utils/store";
import { assign, fromPromise, setup } from "xstate";

const passkeySetup = setup({
  types: {
    context: {} as { error?: string; loading: boolean },
  },
  actors: {
    registerPasskey: fromPromise(async () => {
      const res = await authClient.passkey.addPasskey();
      if (res.error) {
        throw res.error.message;
      } else {
        return res.data;
      }
    }),
    loginWithPasskey: fromPromise(async () => {
      const res = await authClient.signIn.passkey();
      if (res.error) {
        throw res.error.message;
      } else {
        return res.data;
      }
    }),
    setPasskeyRegistered: fromPromise(async () => {
      await store.set("passkeyRegistered", true);
      await store.save();
    }),
  },
});

export const passkeyMachine = passkeySetup.createMachine({
  id: "passkey",
  context: {
    loading: false,
  },
  initial: "idle",
  states: {
    idle: {
      entry: assign({
        loading: false,
      }),
      on: {
        register: {
          target: "registering",
        },
        authenticate: {
          target: "authenticating",
        },
      },
    },
    registering: {
      entry: assign({ loading: true }),
      invoke: {
        src: "registerPasskey",
        onDone: {
          target: "savingPasskeyRegistered",
        },
        onError: {
          target: "idle",
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    authenticating: {
      entry: assign({ loading: true }),
      invoke: {
        src: "loginWithPasskey",
        onDone: {
          target: "savingPasskeyRegistered",
        },
        onError: {
          target: "idle",
          actions: assign({ error: ({ event }) => String(event.error) }),
        },
      },
    },
    savingPasskeyRegistered: {
      invoke: {
        src: "setPasskeyRegistered",
        onDone: { target: "done" },
        onError: { target: "done" },
      },
    },
    done: {
      entry: assign({
        loading: false,
        error: undefined,
      }),
      type: "final",
    },
  },
});
