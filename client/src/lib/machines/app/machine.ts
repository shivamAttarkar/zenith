import { platform } from "@tauri-apps/plugin-os";
import { store } from "$lib/utils/store";
import { assign, fromPromise, setup, and } from "xstate";
import { authMachine } from "../auth/machine";
import { authClient } from "$lib/utils/auth";
import { passkeyMachine } from "../passkey/machine";
import type { Theme } from "$lib/themes";

const appSetup = setup({
  types: {
    context: {} as {
      platform: ReturnType<typeof platform>;
      theme: Theme;
      passkeyRegistered: boolean;
      user?: {
        id: string;
        email: string;
        name: string;
        session: typeof authClient.$Infer.Session;
      };
    },
    children: {} as {
      auth: "authMachine";
      passkey: "passkeyMachine";
    },
  },
  guards: {
    hasSession: ({ context }) => context.user !== undefined,
    hasPasskey: ({ context }) => context.passkeyRegistered,
  },
  actors: {
    loadConfig: fromPromise(
      async (): Promise<{ theme?: Theme; passkeyRegistered?: boolean }> => {
        return {
          theme: await store.get("theme"),
          passkeyRegistered: await store.get("passkeyRegistered"),
        };
      },
    ),
    loadSession: fromPromise(async () => {
      const res = await authClient.getSession();
      if (res.error) {
        // FIXME: handle error more gracefully
        throw res.error.message;
      }
      return res.data;
    }),
    processPublicKey: fromPromise(async () => {}),
    initilizeDB: fromPromise(async () => {}),
    authMachine,
    passkeyMachine,
  },
});

const appMachine = appSetup.createMachine({
  id: "app",
  context: {
    platform: platform(),
    theme: "light",
    user: undefined,
    passkeyRegistered: false,
  },
  initial: "initializing",
  states: {
    initializing: {
      type: "parallel",
      states: {
        config: {
          initial: "pending",
          states: {
            pending: {
              invoke: {
                src: "loadConfig",
                onDone: {
                  target: "done",
                  actions: assign({
                    theme: ({ event }) => event.output.theme ?? "light",
                    passkeyRegistered: ({ event }) =>
                      event.output.passkeyRegistered ?? false,
                  }),
                },
              },
            },
            done: { type: "final" },
          },
        },
        session: {
          initial: "pending",
          states: {
            pending: {
              invoke: {
                src: "loadSession",
                onDone: {
                  target: "done",
                  actions: assign({
                    user: ({ event }) => {
                      if (!event.output) {
                        return undefined;
                      }
                      return {
                        id: event.output.user.id,
                        name: event.output.user.name,
                        email: event.output.user.email,
                        session: event.output,
                      };
                    },
                  }),
                },
                onError: {
                  target: "done",
                  actions: assign({
                    user: undefined,
                  }),
                },
              },
            },
            done: { type: "final" },
          },
        },
      },
      onDone: [
        { target: "ready", guard: and(["hasSession", "hasPasskey"]) },
        { target: "registeringPasskey", guard: "hasSession" },
        { target: "authenticating" },
      ],
    },
    authenticating: {
      invoke: {
        src: "authMachine",
        id: "auth",
        onDone: { target: "initializing" },
        onError: {
          target: "error",
        },
      },
    },
    registeringPasskey: {
      invoke: {
        src: "passkeyMachine",
        id: "passkey",
        onDone: {
          target: "initializing",
        },
        onError: {
          target: "error",
        },
      },
    },
    processingPublicKey: {},
    initializingDB: {},
    ready: {},
    error: {},
  },
});

export default appMachine;
