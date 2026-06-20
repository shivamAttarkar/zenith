<script>
    import ThemeIcon from "$lib/icons/brush.svg?component";
    import MessagesIcon from "$lib/icons/messages.svg?component";
    import FriendsIcon from "$lib/icons/friends.svg?component";
    import UserIcon from "$lib/icons/user.svg?component";
    import ExpandIcon from "$lib/icons/expand.svg?component";
    import LogoutIcon from "$lib/icons/logout.svg?component";
    import { page } from "$app/state";
    import { appMachineRef } from "$lib/machines";
    import { useSelector } from "@xstate/svelte";

    let { children } = $props();
    const user = useSelector(appMachineRef, (snap) => snap.context.user);
</script>

<div class="drawer lg:drawer-open h-full">
    <input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col h-full overflow-hidden">
        {@render children()}
    </div>

    <div class="drawer-side is-drawer-close:overflow-visible">
        <label
            for="my-drawer-4"
            aria-label="close sidebar"
            class="drawer-overlay"
        ></label>
        <div
            class="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-16 is-drawer-open:w-64"
        >
            <ul class="menu w-full grow gap-2">
                <li>
                    <a
                        href="/home/chats"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                        data-tip="Chats"
                        class:active={page.url.pathname.startsWith(
                            "/home/chats",
                        )}
                    >
                        <MessagesIcon class="size-6"></MessagesIcon>
                        <span class="is-drawer-close:hidden">Chats</span>
                    </a>
                </li>
                <li>
                    <a
                        href="/home/friends"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                        data-tip="Friends"
                        class:active={page.url.pathname.startsWith(
                            "/home/friends",
                        )}
                    >
                        <FriendsIcon class="size-6"></FriendsIcon>
                        <span class="is-drawer-close:hidden">Friends</span>
                    </a>
                </li>
                <li>
                    <a
                        href="/home/theme"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                        data-tip="Theme"
                        class:active={page.url.pathname.startsWith(
                            "/home/theme",
                        )}
                    >
                        <ThemeIcon class="size-6"></ThemeIcon>
                        <span class="is-drawer-close:hidden">Theme</span>
                    </a>
                </li>
            </ul>
            <ul class="menu grow gap-2 w-full justify-end">
                <li>
                    <label
                        for="my-drawer-4"
                        aria-label="open sidebar"
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right w-full"
                        data-tip="Expand"
                    >
                        <ExpandIcon class="size-6"></ExpandIcon>
                        <span class="is-drawer-close:hidden">Expand</span>
                    </label>
                </li>
                <li>
                    <button
                        class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                        data-tip={$user?.name || "User"}
                        popovertarget="popover-1"
                        style="anchor-name:--anchor-1"
                    >
                        <UserIcon class="size-6"></UserIcon>
                        <span class="is-drawer-close:hidden">User</span>
                    </button>
                    <ul
                        class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm p-2"
                        popover
                        id="popover-1"
                        style="position-anchor:--anchor-1; position-area: top span-right; margin-bottom: 8px;"
                    >
                        <div class="join join-vertical w-full">
                            <span class="p-2">{$user?.name || "User"}</span>
                            <li>
                                <button class="btn-error btn rounded-box" onclick={() => appMachineRef.send({ type: "LOGOUT" })}>
                                    <LogoutIcon></LogoutIcon>
                                    logout
                                </button>
                            </li>
                        </div>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</div>
