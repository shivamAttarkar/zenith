import { assign, fromPromise, setup } from "xstate";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { apiClient } from "$lib/utils/api";
import { appMachineRef } from "$lib/machines";
import { crypto } from "$lib/utils/crypto";
import { getContactPublicKey } from "$lib/utils/getContactPublicKey";
import { sqlite as db } from "$lib/db/sqlite";
import { friendRequests, users } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";
import type { FriendRequestModel } from "$server/routes/friend-request/model";

type ServerFriendRequest =
  FriendRequestModel["friendRequestListResponse"][number];

async function upsertUser(userId: string): Promise<void> {
  const { data, error } = await apiClient.api.v1.user({ id: userId }).get();
  if (error) {
    return;
  }
  await db
    .insert(users)
    .values({
      id: data.id,
      name: data.name,
      email: data.email,
      image: data.image ?? null,
      publicKey: data.publicKey ?? null,
      cachedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: data.name,
        email: data.email,
        image: data.image ?? null,
        publicKey: data.publicKey ?? null,
        cachedAt: Date.now(),
      },
    });
  notifyChange("users", "upsert", { id: userId });
}

export async function upsertFriendRequest(data: ServerFriendRequest) {
  await Promise.all([
    db
      .insert(friendRequests)
      .values({
        id: data.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        status: data.status,
        verifiedBySender: data.verifiedBySender,
        verifiedByReceiver: data.verifiedByReceiver,
        expiresAt: new Date(data.expiresAt).getTime(),
        createdAt: new Date(data.createdAt).getTime(),
        syncedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: friendRequests.id,
        set: {
          status: data.status,
          verifiedBySender: data.verifiedBySender,
          verifiedByReceiver: data.verifiedByReceiver,
          syncedAt: Date.now(),
        },
      }),
    upsertUser(
      data.senderId === appMachineRef.getSnapshot().context.user?.id
        ? data.receiverId
        : data.senderId,
    ),
  ]);
  notifyChange("friend_requests", "upsert", { id: data.id });
}

type Context = {
  friendRequestId: string | null;
  receiverId: string | null;
  authOptions: PublicKeyCredentialRequestOptionsJSON | null;
  error: string | null;
};

const friendRequestSetup = setup({
  types: {
    context: {} as Context,
    events: {} as
      | { type: "send"; receiverId: string }
      | { type: "verify"; id: string }
      | { type: "retry" },
  },
  actors: {
    createRequest: fromPromise(
      async ({ input }: { input: { receiverId: string } }) => {
        const { data, error } = await apiClient.api.v1["friend-request"].post({
          receiverId: input.receiverId,
        });
        if (error) {
          if (error.value && error.value instanceof Object) {
            throw new Error(error.value.message);
          }
          throw new Error(error.value);
        }
        await upsertFriendRequest(data);
        return data.id;
      },
    ),

    getAuthOptions: fromPromise(
      async ({ input }: { input: { id: string } }) => {
        const { data, error } = await apiClient.api.v1["friend-request"]
          ["auth-options"]({ id: input.id })
          .get();
        if (error) {
          if (error.value && error.value instanceof Object) {
            throw new Error(error.value.message);
          }
          throw new Error(error.value);
        }
        return data as PublicKeyCredentialRequestOptionsJSON;
      },
    ),

    verifyRequest: fromPromise(
      async ({
        input,
      }: {
        input: {
          id: string;
          options: PublicKeyCredentialRequestOptionsJSON;
        };
      }) => {
        const authResponse = await startAuthentication({
          optionsJSON: input.options,
        });
        const { data, error } = await apiClient.api.v1[
          "friend-request"
        ].verify.post({
          id: input.id,
          authenticationResponse: authResponse,
        });
        if (error) {
          if (error.value && error.value instanceof Object) {
            throw new Error(error.value.message);
          }
          throw new Error(error.value);
        }
        await upsertFriendRequest(data);
        if (data.verifiedBySender && data.verifiedByReceiver) {
          const currentUserId = appMachineRef.getSnapshot().context.user?.id;
          if (currentUserId) {
            const friendId =
              data.senderId === currentUserId ? data.receiverId : data.senderId;
            const publicKey = await getContactPublicKey(friendId);
            await crypto.deriveSharedSecret(publicKey, friendId);
          }
        }
      },
    ),
  },
});

export const friendRequestMachine = friendRequestSetup.createMachine({
  id: "friendRequest",
  context: {
    friendRequestId: null,
    receiverId: null,
    authOptions: null,
    error: null,
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        send: {
          target: "creating",
          actions: assign({ receiverId: ({ event }) => event.receiverId }),
        },
        verify: {
          target: "fetchingOptions",
          actions: assign({ friendRequestId: ({ event }) => event.id }),
        },
      },
    },
    creating: {
      invoke: {
        src: "createRequest",
        input: ({ context }) => ({ receiverId: context.receiverId! }),
        onDone: {
          target: "fetchingOptions",
          actions: assign({ friendRequestId: ({ event }) => event.output }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
    },
    fetchingOptions: {
      invoke: {
        src: "getAuthOptions",
        input: ({ context }) => ({ id: context.friendRequestId! }),
        onDone: {
          target: "verifying",
          actions: assign({ authOptions: ({ event }) => event.output }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
    },
    verifying: {
      invoke: {
        src: "verifyRequest",
        input: ({ context }) => ({
          id: context.friendRequestId!,
          options: context.authOptions!,
        }),
        onDone: {
          target: "idle",
          actions: assign({
            error: null,
            friendRequestId: null,
            authOptions: null,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
    },
    error: {
      on: {
        retry: {
          target: "idle",
          actions: assign({ error: null }),
        },
      },
    },
  },
});
