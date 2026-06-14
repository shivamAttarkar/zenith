<script>
    import "./layout.css";
    import { useMachine, useSelector } from "@xstate/svelte";
    import appMachine from "../lib/machines/app/machine";

    let { children } = $props();
    const { actorRef } = useMachine(appMachine);
    const context = useSelector(actorRef, (snapshot) => snapshot.context);

    console.log("Context: ", $context);
</script>

<!-- Status bar background that adapts to the active theme -->
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
