<script lang="ts">
    import PasskeyIcon from "$lib/icons/passkey.svg?component";
    import Button from "$lib/components/Button/Button.svelte";
    import { get, derived } from "svelte/store";
    import { appMachineRef } from "$lib/machines/index";
    import { useSelector } from "@xstate/svelte";
    const passkeyMachineStore = useSelector(
        appMachineRef,
        (snapshot) => snapshot.children.passkey,
    );
    const passkeyContext = derived(
        passkeyMachineStore,
        ($authRef, set) => {
            if (!$authRef) return;
            const sub = $authRef.subscribe((snap) =>
                set({ ...snap.context, state: snap.value }),
            );
            return () => sub.unsubscribe();
        },
        { loading: false } as {
            error?: string;
            loading: boolean;
            state?: "idle" | "registering" | "authenticating" | "done";
        },
    );
</script>

<div
    class="flex min-h-screen w-screen items-center justify-center overflow-y-auto p-4 pb-20"
>
    <div class="container max-w-sm">
        <h2 class="text-center text-2xl font-bold my-2">Register Passkey</h2>
        <div class="flex flex-col items-center gap-2">
            <PasskeyIcon class="size-24" />
            <p class="text-center">
                With passkeys you don't need to remember complex passwords.
                Passkey registration is necessary to use this application.
            </p>
            {#if $passkeyContext.error}
                <p class="text-sm text-error">{$passkeyContext.error}</p>
            {/if}
            <Button
                variant="secondary"
                width="fill"
                style="soft"
                loading={$passkeyContext.loading &&
                    $passkeyContext.state === "registering"}
                onclick={() => {
                    get(passkeyMachineStore)?.send({ type: "register" });
                }}
            >
                Register Passkey
            </Button>
            <Button
                variant="ghost"
                width="fill"
                style="soft"
                loading={$passkeyContext.loading &&
                    $passkeyContext.state === "authenticating"}
                onclick={() => {
                    get(passkeyMachineStore)?.send({ type: "authenticate" });
                }}
            >
                Use existing Passkey
            </Button>
        </div>
    </div>
</div>
