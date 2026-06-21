import { platform } from "@tauri-apps/plugin-os";
import { store } from "$lib/utils/store";
import { assign, fromPromise, fromCallback, setup, and } from "xstate";
import { handleWsMessage } from "$lib/utils/handleWsMessage";
import { wsChatSend } from "$lib/stores/wsSend";
import { authMachine } from "../auth/machine";
import { authClient } from "$lib/utils/auth";
import { passkeyMachine } from "../passkey/machine";
import type { Theme } from "$lib/themes";
import { apiClient } from "$lib/utils/api";
import { crypto } from "$lib/utils/crypto";
import { migrate } from "$lib/db/migrate";
import { upsertUser } from "$lib/db/operations/users";
import { upsertFriendRequest, getAcceptedContactIds } from "$lib/db/operations/friends";
import { dropAllTables } from "$lib/db/operations/schema";

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
        image?: string | null;
        session: typeof authClient.$Infer.Session;
      };
    },
    events: {} as { type: "LOGOUT" },
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
    syncPublicKey: fromPromise(async () => {
      const localKey = await crypto.getPublicKey();
      const res = await apiClient.api.v1["public-key"].get();
      if (res.status !== 200 && res.status !== 404) {
        throw new Error("Failed to fetch public key");
      }
      if (res.status === 200 && res.data?.publicKey === localKey) {
        return;
      }
      if (res.status === 200) {
        const del = await apiClient.api.v1["public-key"].delete();
        if (del.status !== 200) {
          throw new Error("Failed to delete stale public key");
        }
      }
      const post = await apiClient.api.v1["public-key"].post({
        publicKey: localKey,
      });
      if (post.status !== 200) {
        throw new Error("Failed to upload public key");
      }
    }),
    initilizeDB: fromPromise(
      async ({
        input,
      }: {
        input: {
          user?: {
            id: string;
            name: string;
            email: string;
            image?: string | null;
          };
        };
      }) => {
        await migrate();
        const publicKey = await crypto.getPublicKey();
        if (!input.user) {
          throw new Error("User is not present.");
        }
        await upsertUser({ ...input.user, publicKey });
      },
    ),
    syncFriendRequests: fromPromise(async () => {
      const { data, error } =
        await apiClient.api.v1["friend-request"].find.get();
      if (error || !data) return;
      for (const req of data) {
        await upsertFriendRequest(req);
      }
    }),
    logout: fromPromise(async () => {
      await apiClient.api.v1["public-key"].delete();
      const contactIds = await getAcceptedContactIds();
      await dropAllTables();
      await crypto.deleteContactKeys(contactIds);
      await crypto.reinitKeys();
      await authClient.signOut();
    }),
    webSocket: fromCallback(({ sendBack }) => {
      let shouldReconnect = true;
      let reconnectTimer: ReturnType<typeof setTimeout>;
      let sub: ReturnType<typeof apiClient.ws.chat.subscribe>;

      function connect() {
        sub = apiClient.ws.chat.subscribe();
        sub.on("open", () => {
          sendBack({ type: "wsConnected" });
          wsChatSend.set((data) => sub.send(data));
        });
        sub.on("close", () => {
          sendBack({ type: "wsDisconnected" });
          wsChatSend.set(null);
          if (shouldReconnect) reconnectTimer = setTimeout(connect, 3000);
        });
        sub.on("message", ({ data }) => handleWsMessage(data));
      }
      connect();
      return () => {
        shouldReconnect = false;
        clearTimeout(reconnectTimer);
        wsChatSend.set(null);
        sub.close();
      };
    }),
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
                  actions: [
                    assign({
                      theme: ({ event }) => event.output.theme ?? "light",
                      passkeyRegistered: ({ event }) =>
                        event.output.passkeyRegistered ?? false,
                    }),
                    ({ event }) => {
                      const theme = event.output.theme;
                      if (!theme || theme === "system") {
                        document.documentElement.removeAttribute("data-theme");
                      } else {
                        document.documentElement.setAttribute(
                          "data-theme",
                          theme,
                        );
                      }
                    },
                  ],
                },
                onError: { target: "#app.error" },
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
                        image: event.output.user.image,
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
        {
          target: "syncingPublicKey",
          guard: and(["hasSession", "hasPasskey"]),
        },
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
    syncingPublicKey: {
      invoke: {
        src: "syncPublicKey",
        onDone: {
          target: "initializingDB",
        },
        onError: {
          target: "error",
        },
      },
    },
    initializingDB: {
      invoke: {
        src: "initilizeDB",
        input: ({ context }) => ({ user: context.user }),
        onDone: { target: "syncingFriendRequests" },
        onError: { target: "error" },
      },
    },
    syncingFriendRequests: {
      invoke: {
        src: "syncFriendRequests",
        onDone: { target: "ready" },
        onError: { target: "error" },
      },
    },
    ready: {
      invoke: [{ src: "webSocket" }],
      on: {
        LOGOUT: "logout",
      },
    },
    logout: {
      invoke: {
        src: "logout",
        onDone: {
          target: "initializing",
          actions: assign({ user: undefined, passkeyRegistered: false }),
        },
        onError: {
          target: "initializing",
          actions: assign({ user: undefined, passkeyRegistered: false }),
        },
      },
    },
    error: {},
  },
});

export default appMachine;
