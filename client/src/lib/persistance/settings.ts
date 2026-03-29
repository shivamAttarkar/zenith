import { load } from '@tauri-apps/plugin-store';
import { writable } from 'svelte/store';
import { config } from '$lib/config';

type Settings = {
  theme: 'light' | 'dark';
  passkeyRegistered: boolean;
  rsaKeysPresent: boolean;
  publicKey: string | undefined;
};

const DEFAULTS: Settings = {
  theme: 'light',
  passkeyRegistered: false,
  rsaKeysPresent: false,
  publicKey: undefined
};

let tauriStore: Awaited<ReturnType<typeof load>>;

function Settings() {
  const { subscribe, set, update } = writable<Settings>(DEFAULTS);

  return {
    subscribe,
    async init() {
      tauriStore = await load(config.globalStoreName);
      const saved = await tauriStore.get<Settings>('state');
      set({ ...DEFAULTS, ...saved });
    },
    async set(state: Settings) {
      set(state);
      await tauriStore.set('state', state);
    },
    async update(fn: (state: Settings) => Settings) {
      update((current) => {
        const next = fn(current);
        tauriStore.set('state', next);
        return next;
      });
    },
    async reset() {
      set(DEFAULTS);
      await tauriStore.delete('state');
    }
  };
}

export const settings = Settings();
