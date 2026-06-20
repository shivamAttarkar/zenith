<script>
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    onMount(() => goto("/home/chats", { replaceState: true }));
</script>
