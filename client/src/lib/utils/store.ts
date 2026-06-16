import { load } from "@tauri-apps/plugin-store";

export const store = await load("settings.json").catch((e) => {
  throw new Error(`Failed to load settings store: ${e}`);
});
