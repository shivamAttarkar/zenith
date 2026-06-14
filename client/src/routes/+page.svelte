<script>
    import { apiClient } from "$lib/api";
    import { authClient } from "$lib/auth";
    let health = $state("");
    let session = $state("");
    const res = await apiClient.health.get();
    health = JSON.stringify(res);
    const res1 = await authClient.getSession();
    session = JSON.stringify(res1);
</script>

<p>{health}</p>
<p>{session}</p>
