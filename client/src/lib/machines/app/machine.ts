import { platform } from "@tauri-apps/plugin-os";
import { load } from "@tauri-apps/plugin-store";
import { assign, fromPromise, setup } from "xstate";

const appSetup = setup({
  types: {
    context: {} as {
      platform: ReturnType<typeof platform>;
      theme: string;
      user?: {
        email: string;
        username: string;
      };
    },
  },
  actors: {
    loadTheme: fromPromise(async (): Promise<string | undefined> => {
      const store = await load("settings.json");
      return await store.get("theme");
    }),
    loadSession: fromPromise(async () => {}),
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
                    user: undefined,
                  }),
                },
              },
            },
            done: { type: "final" },
          },
        },
      },
      onDone: "ready",
    },
    ready: {},
  },
});

export default appMachine;
