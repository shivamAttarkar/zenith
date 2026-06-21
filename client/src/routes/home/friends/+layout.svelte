<script>
    import { page } from "$app/state";

    let { children } = $props();
</script>

<div class="flex flex-col h-full">
    <div class="shrink-0 px-4 pt-4 pb-1">
        <h2 class="text-xl font-semibold">Friends</h2>
    </div>
    <div role="tablist" class="tabs tabs-border shrink-0 px-4 pt-2">
        <a
            href="/home/friends/requests"
            role="tab"
            class="tab"
            class:tab-active={page.url.pathname.startsWith(
                "/home/friends/requests",
            )}
        >
            Requests
        </a>
        <a
            href="/home/friends/search"
            role="tab"
            class="tab"
            class:tab-active={page.url.pathname.startsWith(
                "/home/friends/search",
            )}
        >
            Search
        </a>
    </div>
    <div class="flex flex-col grow min-h-0">
        {@render children()}
    </div>
</div>
