<script>
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    onMount(() => goto("/home/friends/requests", { replaceState: true }));
</script>
