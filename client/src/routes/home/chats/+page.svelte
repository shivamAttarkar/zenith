<script>
    import { conversationsStore } from "$lib/stores/conversations";
</script>

<div class="p-4">Chats</div>

{#each $conversationsStore as conversation}
    <div>{conversation.id}</div>
{/each}
