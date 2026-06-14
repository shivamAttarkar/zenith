<script lang="ts">
    import type { Component, Snippet } from "svelte";
    import type { VariantProps } from "class-variance-authority";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import { cn } from "$lib/utils/cn";
    import { buttonCVA } from "./Button.variants";

    type ButtonVariants = VariantProps<typeof buttonCVA>;

    let {
        variant,
        style,
        shape,
        size,
        width,
        class: className,
        icon: Icon,
        loading = false,
        children,
        ...props
    }: ButtonVariants &
        HTMLButtonAttributes & {
            icon?: Component;
            loading?: boolean;
            children: Snippet;
        } = $props();
</script>

<button
    class={cn(buttonCVA({ variant, style, shape, size, width }), className)}
    disabled={loading}
    {...props}
>
    {#if loading}
        <span class="loading loading-spinner"></span>
        loading
    {:else}
        {#if Icon}<Icon class="size-5" />{/if}
        {@render children()}
    {/if}
</button>
