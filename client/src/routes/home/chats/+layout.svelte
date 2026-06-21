<script lang="ts">
    import { page } from "$app/state";
    import { conversationsStore } from "$lib/stores/conversations";
    import { appMachineRef } from "$lib/machines";
    import { useSelector } from "@xstate/svelte";
    import MessagesIcon from "$lib/icons/messages.svg?component";

    let { children } = $props();

    const currentUser = useSelector(appMachineRef, (snap) => snap.context.user);

    function formatTime(ts: number | null): string {
        if (!ts) return "";
        const date = new Date(ts);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    }
</script>

<div class="flex h-full overflow-hidden">
    <div
        class="flex flex-col w-72 shrink-0 border-r border-base-300 overflow-hidden"
    >
        <div class="shrink-0 px-4 pt-4 pb-2">
            <h2 class="text-xl font-semibold">Chats</h2>
        </div>

        {#if $conversationsStore.length === 0}
            <div
                class="flex flex-col mb-20 items-center justify-center gap-2 grow text-base-content/40"
            >
                <MessagesIcon class="size-12" />
                <span class="text-sm">No conversations yet</span>
            </div>
        {:else}
            <ul class="flex flex-col grow overflow-y-auto">
                {#each $conversationsStore as conv (conv.id)}
                    {@const isActive =
                        page.url.pathname === `/home/chats/${conv.id}`}
                    <li>
                        <a
                            href="/home/chats/{conv.id}"
                            class="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors
                                {isActive
                                ? 'bg-primary/10 border-l-2 border-primary'
                                : 'border-l-2 border-transparent'}"
                        >
                            <div class="avatar avatar-placeholder shrink-0">
                                <div
                                    class="size-11 rounded-full bg-neutral text-neutral-content"
                                >
                                    {#if conv.contactImage}
                                        <img
                                            src={conv.contactImage}
                                            alt={conv.contactName}
                                        />
                                    {:else}
                                        <span class="text-sm">
                                            {conv.contactName[0]?.toUpperCase() ??
                                                "?"}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                            <div class="flex flex-col grow min-w-0">
                                <div
                                    class="flex items-center justify-between gap-2"
                                >
                                    <span class="font-medium truncate"
                                        >{conv.contactName}</span
                                    >
                                    {#if conv.lastMessageAt}
                                        <span
                                            class="text-xs text-base-content/40 shrink-0"
                                        >
                                            {formatTime(conv.lastMessageAt)}
                                        </span>
                                    {/if}
                                </div>
                                <div
                                    class="flex items-center justify-between gap-2 mt-0.5"
                                >
                                    <span
                                        class="text-sm text-base-content/50 truncate"
                                    >
                                        {#if conv.lastMessagePayload}
                                            {conv.lastMessageSenderId ===
                                            $currentUser?.id
                                                ? "You: "
                                                : ""}{conv.lastMessagePayload}
                                        {:else}
                                            No messages yet
                                        {/if}
                                    </span>
                                    {#if conv.unreadCount > 0}
                                        <span
                                            class="badge badge-primary badge-sm shrink-0 rounded-full min-w-4 justify-center"
                                        >
                                            {conv.unreadCount > 99
                                                ? "99+"
                                                : conv.unreadCount}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        </a>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>

    <div class="flex flex-col grow min-w-0 overflow-hidden">
        {@render children()}
    </div>
</div>
