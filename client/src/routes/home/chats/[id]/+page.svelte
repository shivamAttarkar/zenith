<script lang="ts">
    import { page } from "$app/state";
    import { useSelector } from "@xstate/svelte";
    import { conversationsStore } from "$lib/stores/conversations";
    import { messagesStore, activeConversationId } from "$lib/stores/messages";
    import { wsChatSend } from "$lib/stores/wsSend";
    import { appMachineRef } from "$lib/machines";
    import { upsertMessage } from "$lib/db/operations/messages";
    import { markConversationRead } from "$lib/db/operations/conversations";

    const currentUser = useSelector(appMachineRef, (snap) => snap.context.user);
    const conversation = $derived(
        $conversationsStore.find((c) => c.id === page.params.id),
    );

    let messagesElement = $state<HTMLElement | null>(null);
    let inputValue = $state("");
    let sending = $state(false);

    $effect(() => {
        const convId = page.params.id;
        if (!convId) {
            return;
        }
        activeConversationId.set(convId);
        markConversationRead(convId);
        return () => activeConversationId.set(null);
    });

    $effect(() => {
        $messagesStore.length;
        if (messagesElement) {
            messagesElement.scrollTop = messagesElement.scrollHeight;
        }
    });

    async function sendMessage() {
        const text = inputValue.trim();
        const cId = conversation?.contactId;
        const user = $currentUser;
        if (!text || !cId || !user || sending) {
            return;
        }

        inputValue = "";
        sending = true;
        const id = crypto.randomUUID();
        const ts = Date.now();

        try {
            await upsertMessage({
                id,
                ts,
                senderId: user.id,
                receiverId: cId,
                payload: { format: "string", msg: text },
            });
            $wsChatSend?.({
                type: "chat",
                id,
                ts,
                senderId: user.id,
                receiverId: cId,
                payload: { format: "string", msg: text },
            });
        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            sending = false;
        }
    }

    function formatTime(ts: number) {
        return new Date(ts).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

{#if !conversation}
    <div class="flex items-center justify-center h-full">
        <span class="loading loading-spinner loading-lg"></span>
    </div>
{:else}
    <div class="flex flex-col h-full overflow-hidden">
        <div
            class="flex items-center gap-3 px-4 py-3 border-b border-base-300 shrink-0 bg-base-100"
        >
            <div class="avatar avatar-placeholder">
                <div
                    class="size-9 rounded-full bg-neutral text-neutral-content"
                >
                    {#if conversation.contactImage}
                        <img
                            src={conversation.contactImage}
                            alt={conversation.contactName}
                        />
                    {:else}
                        <span class="text-sm"
                            >{conversation.contactName[0]?.toUpperCase() ??
                                "?"}</span
                        >
                    {/if}
                </div>
            </div>
            <span class="font-semibold">{conversation.contactName}</span>
        </div>
        <div
            bind:this={messagesElement}
            class="flex flex-col grow overflow-y-auto px-2 py-4"
        >
            {#if $messagesStore.length === 0}
                <div
                    class="flex flex-col items-center justify-center h-full gap-2 text-base-content/40"
                >
                    <span class="text-sm">No messages yet.</span>
                </div>
            {:else}
                {#each $messagesStore as msg (msg.id)}
                    {@const isMine = msg.senderId === $currentUser?.id}
                    <div class="chat {isMine ? 'chat-end' : 'chat-start'}">
                        <div class="chat-image avatar avatar-placeholder">
                            <div
                                class="w-8 rounded-full bg-neutral text-neutral-content"
                            >
                                {#if isMine}
                                    {#if $currentUser?.image}
                                        <img
                                            src={$currentUser.image}
                                            alt={$currentUser.name}
                                        />
                                    {:else}
                                        <span class="text-xs"
                                            >{$currentUser?.name[0]?.toUpperCase() ??
                                                "?"}</span
                                        >
                                    {/if}
                                {:else if conversation.contactImage}
                                    <img
                                        src={conversation.contactImage}
                                        alt={conversation.contactName}
                                    />
                                {:else}
                                    <span class="text-xs"
                                        >{conversation.contactName[0]?.toUpperCase() ??
                                            "?"}</span
                                    >
                                {/if}
                            </div>
                        </div>
                        <div
                            class="chat-bubble {isMine
                                ? 'chat-bubble-primary'
                                : ''} whitespace-pre-wrap wrap-break-word"
                        >
                            {msg.payload}
                        </div>
                        <div class="chat-footer opacity-50 text-xs">
                            <time>{formatTime(msg.timestamp)}</time>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>

        <div class="shrink-0 border-t border-base-300 px-4 py-3 bg-base-100">
            <div class="flex items-center gap-2">
                <input
                    type="text"
                    bind:value={inputValue}
                    onkeydown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    class="input input-bordered w-full"
                    placeholder="Type a message…"
                    disabled={sending}
                />
                <button
                    class="btn btn-primary shrink-0"
                    onclick={sendMessage}
                    disabled={!inputValue.trim() || sending}
                >
                    {#if sending}
                        <span class="loading loading-spinner loading-sm"></span>
                    {:else}
                        Send
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
