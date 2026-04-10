<script lang="ts">
  import './layout.css';
  import '@fontsource-variable/outfit/wght.css';
  import { appMachine, startMachine } from '$lib/machines';
  import { useSelector } from '@xstate/svelte';
  import { onMount } from 'svelte';
  import MdiAlertCircleOutline from '~icons/mdi/alert-circle-outline';

  const { children } = $props();

  onMount(() => {
    startMachine();
    return () => appMachine.stop();
  });

  const isError = useSelector(appMachine, (state) => state.matches('error'));
  const error = useSelector(appMachine, (state) => state.context.error);
  const showChildren = useSelector(appMachine, (state) => state.hasTag('ui'));
</script>

{#if $isError}
  <div class="flex h-screen w-screen flex-col items-center justify-center gap-4 p-4">
    <MdiAlertCircleOutline style="font-size: 4rem" class="text-error" />
    <div class="text-center">
      <h2 class="text-2xl font-bold">Something went wrong</h2>
      <p class="mt-1 text-sm text-base-content/60">{$error}</p>
    </div>
    <button class="btn btn-primary" onclick={() => appMachine.send({ type: 'retry' })}>
      Try again
    </button>
  </div>
{:else if $showChildren}
  {@render children()}
{:else}
  <div class="flex h-screen w-screen animate-pulse items-center justify-center text-6xl">
    Zenith
  </div>
{/if}
