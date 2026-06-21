import { writable } from "svelte/store";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";
export const connectionStatus = writable<ConnectionStatus>("disconnected");
