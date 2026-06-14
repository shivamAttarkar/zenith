import { platform } from "@tauri-apps/plugin-os";
import { load } from "@tauri-apps/plugin-store";
import { assign, fromPromise, setup, type ActorRefFrom } from "xstate";
import { authMachine } from "../auth/machine";
import { authClient } from "$lib/utils/auth";

const appSetup = setup({
  types: {
    context: {} as {
      platform: ReturnType<typeof platform>;
      theme: string;
      user?: {
        id: string;
        email: string;
        name: string;
        session: typeof authClient.$Infer.Session;
      };
      authRef?: ActorRefFrom<typeof authMachine>;
    },
  },
  guards: {
    hasSession: ({ context }) => context.user !== undefined,
  },
  actors: {
    loadTheme: fromPromise(async (): Promise<string | undefined> => {
      const store = await load("settings.json");
      return await store.get("theme");
    }),
    loadSession: fromPromise(async () => {
      const res = await authClient.getSession();
      if (res.error) {
        // FIXME: handle error more gracefully
        throw res.error.message;
      }
      return res.data;
    }),
    authMachine,
  },
});

const appMachine = appSetup.createMachine({
  id: "app",
  context: {
    platform: platform(),
    theme: "light",
    user: undefined,
  },
  initial: "initializing",
  states: {
    initializing: {
      type: "parallel",
      states: {
        theme: {
          initial: "pending",
          states: {
            pending: {
              invoke: {
                src: "loadTheme",
                onDone: {
                  target: "done",
                  actions: assign({
                    theme: ({ event }) => event.output ?? "light",
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
        { target: "ready", guard: "hasSession" },
        { target: "authenticating" },
      ],
    },
    authenticating: {
      entry: assign({
        authRef: ({ spawn }) => spawn("authMachine", { id: "auth" }),
      }),
      exit: assign({ authRef: undefined }),
      on: {
        "xstate.done.actor.auth": { target: "initializing" },
      },
    },
    ready: {},
  },
});

export default appMachine;
