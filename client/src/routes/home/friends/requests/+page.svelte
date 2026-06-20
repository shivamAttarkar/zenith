<script lang="ts">
    import { useSelector } from "@xstate/svelte";
    import { friendRequestsStore } from "$lib/stores/friendRequests";
    import { appMachineRef, friendRequestActor } from "$lib/machines";
    import FriendsIcon from "$lib/icons/friends.svg?component";

    const currentUser = useSelector(appMachineRef, (snap) => snap.context.user);
    const machineState = useSelector(friendRequestActor, (snap) => snap);
    const isProcessing = $derived(
        !$machineState.matches("idle") && !$machineState.matches("error"),
    );
    const processingId = $derived($machineState.context.friendRequestId);
    const machineError = $derived($machineState.context.error);
    const statusConfig = {
        pending: { class: "badge-warning", label: "Pending" },
        accepted: { class: "badge-success", label: "Accepted" },
        rejected: { class: "badge-error", label: "Rejected" },
    } as const;

    function needsVerification(
        req: (typeof $friendRequestsStore)[number],
    ): boolean {
        if (req.status !== "pending") {
            return false;
        }
        const isSent = req.senderId === $currentUser?.id;
        return isSent ? !req.verifiedBySender : !req.verifiedByReceiver;
    }

    function formatDate(ts: number) {
        return new Date(ts).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    }
</script>

<div class="flex flex-col gap-4 p-4 h-full overflow-y-auto">
    {#if machineError}
        <div role="alert" class="alert alert-error alert-soft">
            <span class="text-sm"
                >{machineError ?? "Server Error has occured."}</span
            >
            <button
                class="btn btn-sm btn-ghost ml-auto"
                onclick={() => friendRequestActor.send({ type: "retry" })}
            >
                Dismiss
            </button>
        </div>
    {/if}

    {#if $friendRequestsStore.length === 0}
        <div
            class="flex mb-30 flex-col items-center justify-center gap-3 h-full text-base-content/40"
        >
            <FriendsIcon class="size-20"></FriendsIcon>
            <span class="text-sm">No requests yet</span>
            <a href="/home/friends/search">
                <button class="btn btn-sm btn-secondary btn-soft"
                    >Search for people</button
                >
            </a>
        </div>
    {:else}
        <ul class="flex flex-col gap-2">
            {#each $friendRequestsStore as req (req.id)}
                {@const isSent = req.senderId === $currentUser?.id}
                {@const name = isSent ? req.receiverName : req.senderName}
                {@const image = isSent ? req.receiverImage : req.senderImage}
                {@const config = statusConfig[req.status]}
                {@const canVerify = needsVerification(req)}
                {@const busy = isProcessing && processingId === req.id}
                <li class="flex items-center gap-3 p-3 bg-base-200 rounded-box">
                    <div class="avatar avatar-placeholder">
                        <div
                            class="size-10 rounded-full bg-neutral text-neutral-content"
                        >
                            {#if image}
                                <img src={image} alt={name ?? ""} />
                            {:else}
                                <span class="text-sm">
                                    {(name ?? "?")[0].toUpperCase()}
                                </span>
                            {/if}
                        </div>
                    </div>
                    <div class="flex flex-col grow min-w-0">
                        <span class="font-medium truncate">
                            {name ?? "Unknown"}
                        </span>
                        <span class="text-xs text-base-content/50">
                            {isSent ? "Sent" : "Received"}
                            {formatDate(req.createdAt)}
                        </span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        {#if canVerify}
                            <button
                                class="btn btn-primary btn-xs"
                                disabled={busy ||
                                    (isProcessing && processingId !== req.id)}
                                onclick={() =>
                                    friendRequestActor.send({
                                        type: "verify",
                                        id: req.id,
                                    })}
                            >
                                {#if busy}
                                    <span
                                        class="loading loading-spinner loading-xs"
                                    ></span>
                                {:else}
                                    Verify
                                {/if}
                            </button>
                        {/if}
                        <span class="badge badge-sm {config.class}">
                            {config.label}
                        </span>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>
