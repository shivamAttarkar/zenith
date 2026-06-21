<script lang="ts">
    import { useSelector } from "@xstate/svelte";
    import type { Treaty } from "@elysia/eden";
    import Search from "$lib/components/Search/Search.svelte";
    import { apiClient } from "$lib/utils/api";
    import { appMachineRef, friendRequestActor } from "$lib/machines";
    import { friendRequestsStore } from "$lib/stores/friendRequests";
    import ErrorIcon from "$lib/icons/error.svg?component";

    type SearchUser = Treaty.Data<
        ReturnType<typeof apiClient.api.v1.user.search.get>
    >[number];

    const currentUser = useSelector(appMachineRef, (snap) => snap.context.user);
    const machineState = useSelector(friendRequestActor, (snap) => snap);
    const isProcessing = $derived(
        !$machineState.matches("idle") && !$machineState.matches("error"),
    );
    const processingId = $derived($machineState.context.receiverId);
    const machineError = $derived($machineState.context.error);
    const sentReceiverIds = $derived(
        new Set($friendRequestsStore.map((r) => r.receiverId)),
    );

    let query = $state("");
    let results = $state<SearchUser[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);

    $effect(() => {
        const q = query.trim();
        const currentUserId = $currentUser?.id;

        if (!q) {
            results = [];
            loading = false;
            error = null;
            return;
        }

        loading = true;
        error = null;
        let cancelled = false;

        apiClient.api.v1.user.search
            .get({ query: { name: q } })
            .then(({ data, error: err }) => {
                if (cancelled) return;
                loading = false;
                if (err || !data || !Array.isArray(data)) {
                    error = "Search failed";
                    return;
                }
                results = data.filter((u) => u.id !== currentUserId);
            });

        return () => {
            cancelled = true;
        };
    });

    function addFriend(receiverId: string) {
        friendRequestActor.send({ type: "send", receiverId });
    }

    function buttonLabel(userId: string): string {
        if (isProcessing && processingId === userId) {
            return "";
        }
        if (sentReceiverIds.has(userId)) {
            return "Sent";
        }
        return "Add";
    }
</script>

<div class="flex flex-col gap-4 p-4 h-full overflow-y-auto">
    <Search bind:value={query} placeholder="Search users by name..." />

    {#if machineError}
        <div role="alert" class="alert alert-error alert-soft">
            <ErrorIcon class="size-8"></ErrorIcon>
            <span class="text-sm"
                >{machineError ?? "Server Error has occured."}</span
            >
            <button
                class="btn btn-sm btn-outline btn-error ml-auto"
                onclick={() => friendRequestActor.send({ type: "retry" })}
            >
                Dismiss
            </button>
        </div>
    {/if}

    {#if loading}
        <ul class="flex flex-col gap-2">
            <li class="flex items-center gap-3 p-3 bg-base-200 rounded-box">
                <div class="skeleton size-10 rounded-full shrink-0"></div>
                <div class="flex flex-col grow gap-2">
                    <div class="skeleton h-3 w-28 rounded"></div>
                    <div class="skeleton h-3 w-40 rounded"></div>
                </div>
                <div class="skeleton h-8 w-14 rounded-box shrink-0"></div>
            </li>
        </ul>
    {:else if error}
        <div role="alert" class="alert alert-error alert-soft">
            <span class="text-sm">{error}</span>
        </div>
    {:else if results.length}
        <ul class="flex flex-col gap-2">
            {#each results as user (user.id)}
                {@const alreadySent = sentReceiverIds.has(user.id)}
                {@const busy = isProcessing && processingId === user.id}
                <li class="flex items-center gap-3 p-3 bg-base-200 rounded-box">
                    <div class="avatar avatar-placeholder">
                        <div
                            class="size-10 rounded-full bg-neutral text-neutral-content"
                        >
                            {#if user.image}
                                <img src={user.image} alt={user.name ?? ""} />
                            {:else}
                                <span class="text-sm">
                                    {(user.name ?? "?")[0].toUpperCase()}
                                </span>
                            {/if}
                        </div>
                    </div>
                    <div class="flex flex-col grow min-w-0">
                        <span class="font-medium truncate">{user.name}</span>
                        <span class="text-sm text-base-content/60 truncate"
                            >{user.email}</span
                        >
                    </div>
                    <button
                        class="btn btn-primary btn-sm shrink-0"
                        disabled={alreadySent ||
                            busy ||
                            (isProcessing && processingId !== user.id)}
                        onclick={() => addFriend(user.id)}
                    >
                        {#if busy}
                            <span class="loading loading-spinner loading-xs"
                            ></span>
                        {:else}
                            {buttonLabel(user.id)}
                        {/if}
                    </button>
                </li>
            {/each}
        </ul>
    {:else if query.trim()}
        <div
            class="flex flex-col items-center justify-center gap-2 py-12 text-base-content/40"
        >
            <span class="text-sm">No users found for "{query.trim()}"</span>
        </div>
    {/if}
</div>
