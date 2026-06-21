import { writable } from "svelte/store";
import type { WsClientMessage } from "$server/ws/types";

type WsSendFn = (data: WsClientMessage) => void;
export const wsChatSend = writable<WsSendFn | null>(null);
