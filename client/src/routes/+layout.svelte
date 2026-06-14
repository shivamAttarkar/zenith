<script>
    import "./layout.css";
    import { appMachineRef } from "$lib/machines/index";
    import { startRouter } from "$lib/routing";

    let { children } = $props();
    startRouter(appMachineRef);
</script>

<!-- Status bar background that adapts to the active theme (android) -->
<div
    class="fixed top-0 inset-x-0 bg-base-300 z-50"
    style="height: env(safe-area-inset-top)"
></div>

<!-- All screens live inside here; no screen needs its own safe-area padding -->
<div
    class="fixed inset-0 flex flex-col overflow-hidden"
    style="padding-top: env(safe-area-inset-top)"
>
    {@render children()}
</div>
