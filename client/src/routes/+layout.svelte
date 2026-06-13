<script>
    import { useMachine, useSelector } from "@xstate/svelte";
    import appMachine from "../lib/machines/app/machine";
    let { children } = $props();
    const { actorRef } = useMachine(appMachine);
    const context = useSelector(actorRef, (snapshot) => snapshot.context);
    console.log("Context: ", $context);
</script>

{@render children()}
