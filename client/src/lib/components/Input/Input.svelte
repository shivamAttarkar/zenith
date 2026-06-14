<script lang="ts">
    import { cn } from "$lib/utils/cn";
    import type { Component, Snippet } from "svelte";
    import type { HTMLInputAttributes } from "svelte/elements";

    let {
        prefix,
        suffix,
        icon: Icon,
        error = $bindable(""),
        success = false,
        value = $bindable<string | number>(""),
        datalist = [],
        legend,
        class: className,
        ...rest
    }: {
        prefix?: Snippet;
        suffix?: Snippet;
        icon?: Component;
        error?: string;
        success?: boolean;
        datalist?: string[];
        legend?: string;
    } & HTMLInputAttributes = $props();
</script>

<fieldset class={cn("fieldset", className)}>
    {#if legend}
        <legend class="fieldset-legend">{legend}</legend>
    {/if}
    <label
        class="input w-full"
        class:border-error={error}
        class:outline-error={error}
        class:border-success={success && !error}
        class:outline-success={success && !error}
    >
        {#if Icon}<Icon class="size-5" />{/if}
        {@render prefix?.()}
        <input bind:value {...rest} list="dlist" />
        {@render suffix?.()}
    </label>
    <datalist id="dlist">
        {#each datalist as data (data)}
            <option value={data}></option>
        {/each}
    </datalist>
    <p class="text-xs text-error" class:hidden={!error}>{error}</p>
</fieldset>
