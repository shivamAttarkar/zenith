<script lang="ts">
    import type { Component } from "svelte";
    import type { HTMLInputAttributes } from "svelte/elements";
    import VisibleIcon from "$lib/icons/visible.svg?component";
    import InvisibleIcon from "$lib/icons/invisible.svg?component";
    import Input from "./Input.svelte";

    let {
        value = $bindable<string>(""),
        error = $bindable(""),
        icon,
        legend,
        type: _type,
        success,
        ...rest
    }: HTMLInputAttributes & {
        legend?: string;
        error?: string;
        icon?: Component;
        success?: boolean;
    } = $props();

    let visible = $state(false);
</script>

{#snippet toggleButton()}
    {#if value?.toString().length > 0}
        <button type="button" onclick={() => (visible = !visible)}>
            {#if visible}
                <VisibleIcon class="btn btn-circle btn-ghost btn-xs" />
            {:else}
                <InvisibleIcon class="btn btn-circle btn-ghost btn-xs" />
            {/if}
        </button>
    {/if}
{/snippet}

<Input
    type={visible ? "text" : "password"}
    bind:value
    bind:error
    {icon}
    {legend}
    {success}
    {...rest as Record<string, unknown>}
    suffix={toggleButton}
/>
