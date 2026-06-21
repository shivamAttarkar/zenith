<script lang="ts">
    import { themes } from "$lib/themes";
    import { load } from "@tauri-apps/plugin-store";

    let selectedTheme = $state(
        document.documentElement.getAttribute("data-theme") ?? "system",
    );

    $effect(() => {
        if (selectedTheme === "system") {
            document.documentElement.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute("data-theme", selectedTheme);
        }
    });
</script>

<main class="flex flex-col flex-1 overflow-hidden p-4">
    <h2 class="text-xl font-semibold">Themes</h2>
    <div class="my-4 min-h-0 flex-1 overflow-y-auto rounded-box bg-base-300/90">
        <div
            class="rounded-box grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
            {#each themes as theme}
                <div class:indicator={theme === selectedTheme}>
                    {#if theme === selectedTheme}
                        <span
                            class="indicator-item indicator-middle indicator-center badge badge-ghost"
                            >Selected</span
                        >
                    {/if}
                    <button
                        onclick={async () => {
                            selectedTheme = theme;
                            const store = await load("settings.json");
                            await store.set("theme", selectedTheme);
                        }}
                        class="active:-translate-x-0.5 active:-translate-y-0.5 active:scale-105 active:shadow-lg active:border-base-content/40 border-base-content/20 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:border-base-content/40 overflow-hidden rounded-lg border outline-2 outline-offset-2 outline-transparent cursor-pointer transition text-left"
                        class:outline-border-300={selectedTheme === theme}
                        class:opacity-30={selectedTheme === theme}
                    >
                        <div
                            class="bg-base-100 text-base-content w-full font-sans"
                            data-theme={theme}
                        >
                            <div class="grid grid-cols-5 grid-rows-3">
                                <div
                                    class="bg-base-200 col-start-1 row-span-2 row-start-1"
                                ></div>
                                <div
                                    class="bg-base-300 col-start-1 row-start-3"
                                ></div>
                                <div
                                    class="bg-base-100 col-span-4 col-start-2 row-span-3 row-start-1 flex flex-col gap-1 p-2"
                                >
                                    <div class="font-bold">{theme}</div>
                                    <div class="flex flex-wrap gap-1">
                                        <div
                                            class="bg-primary flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                                        >
                                            <div
                                                class="text-primary-content text-sm font-bold"
                                            >
                                                A
                                            </div>
                                        </div>
                                        <div
                                            class="bg-secondary flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                                        >
                                            <div
                                                class="text-secondary-content text-sm font-bold"
                                            >
                                                A
                                            </div>
                                        </div>
                                        <div
                                            class="bg-accent flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                                        >
                                            <div
                                                class="text-accent-content text-sm font-bold"
                                            >
                                                A
                                            </div>
                                        </div>
                                        <div
                                            class="bg-neutral flex aspect-square w-5 items-center justify-center rounded lg:w-6"
                                        >
                                            <div
                                                class="text-neutral-content text-sm font-bold"
                                            >
                                                A
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            {/each}
        </div>
    </div>
</main>
