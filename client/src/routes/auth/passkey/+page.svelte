<script lang="ts">
  import MaterialSymbolsPasskeyRounded from '~icons/material-symbols/passkey-rounded';
  import { derived } from 'svelte/store';
  import { appMachine } from '$lib/machines';
  import { useSelector } from '@xstate/svelte';
  import type { ActorRefFrom } from 'xstate';
  import type { PasskeyMachine } from '$lib/machines/passkey/machine';

  const passkeyActor = useSelector(
    appMachine,
    (state) => state.children['PasskeyMachine'] as ActorRefFrom<typeof PasskeyMachine>
  );
  const error = derived(passkeyActor, ($actor) => $actor?.getSnapshot().context.error ?? null);
  const isLoading = derived(
    passkeyActor,
    ($actor) =>
      $actor?.getSnapshot().matches('registeringPasskey') ||
      $actor?.getSnapshot().matches('authenticatingWithPasskey') ||
      $actor?.getSnapshot().matches('checkPasskey') ||
      false
  );
  const isCheckFailed = derived(
    passkeyActor,
    ($actor) => $actor?.getSnapshot().matches('checkFailed') || false
  );
</script>

<div class="flex h-screen w-screen items-center justify-center p-4">
  <div class="container max-w-sm">
    <h2 class="text-center text-2xl font-bold">Register Passkey</h2>
    <div class="flex flex-col items-center gap-2">
      <MaterialSymbolsPasskeyRounded style="font-size: 6rem" />
      <p class="text-center">
        With passkeys you don't need to remember complex passwords. Passkey registration is
        necessary to use this application.
      </p>
      {#if $error}
        <p class="text-sm text-error">{$error}</p>
      {/if}
      {#if $isCheckFailed}
        <button
          class="btn btn-block btn-soft btn-secondary"
          onclick={() => $passkeyActor?.send({ type: 'retry' })}
        >
          Retry
        </button>
      {:else}
        <button
          class="btn btn-block btn-soft btn-secondary"
          disabled={$isLoading}
          onclick={() => $passkeyActor?.send({ type: 'registerPasskey' })}
        >
          {#if $isLoading}
            <span class="loading loading-spinner"></span>
            loading
          {:else}
            Register Passkey
          {/if}
        </button>
        <button
          class="btn btn-block btn-ghost btn-outline"
          disabled={$isLoading}
          onclick={() => $passkeyActor?.send({ type: 'useExistingPasskey' })}
        >
          Use Existing Passkey
        </button>
      {/if}
    </div>
  </div>
</div>
