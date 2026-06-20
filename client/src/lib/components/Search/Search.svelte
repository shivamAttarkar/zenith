<script lang="ts">
    import { cn } from "$lib/utils/cn";
    import SearchIcon from "$lib/icons/search.svg?component";
    import CancelIcon from "$lib/icons/cancel.svg?component";

    let {
        value = $bindable(""),
        debounceMs = 300,
        placeholder = "Search...",
        class: className,
    }: {
        value?: string;
        debounceMs?: number;
        placeholder?: string;
        class?: string;
    } = $props();

    let inputValue = $state(value);
    let timeout: ReturnType<typeof setTimeout>;

    function handleInput(e: Event) {
        inputValue = (e.target as HTMLInputElement).value;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            value = inputValue;
        }, debounceMs);
    }

    function clear() {
        inputValue = "";
        clearTimeout(timeout);
        value = "";
    }
</script>

<label class={cn("input w-full", className)}>
    <SearchIcon class="size-4 opacity-70" />
    <input
        type="text"
        {placeholder}
        value={inputValue}
        oninput={handleInput}
        class="grow"
    />
    {#if inputValue}
        <button
            type="button"
            onclick={clear}
            aria-label="Clear search"
            class="btn btn-ghost btn-circle btn-xs opacity-70"
        >
            <CancelIcon class="size-6 text-red-400" />
        </button>
    {/if}
</label>
