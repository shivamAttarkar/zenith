import { Stronghold, Client } from '@tauri-apps/plugin-stronghold';
import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appLocalDataDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import { config } from '$lib/config';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let stronghold: Stronghold;
let client: Client;

export const vault = {
  async init() {
    const password = await invoke<string>('get_stronghold_password');
    const vaultPath = `${await appLocalDataDir()}/${config.vaultName}`;

    stronghold = await Stronghold.load(vaultPath, password);

    try {
      client = await stronghold.loadClient('zenith');
    } catch {
      client = await stronghold.createClient('zenith');
      await stronghold.save();
    }
  },
  async get(key: string): Promise<string | null> {
    const value = await client.getStore().get(key);
    return value ? decoder.decode(value) : null;
  },
  async set(key: string, value: string): Promise<void> {
    await client.getStore().insert(key, Array.from(encoder.encode(value)));
    await stronghold.save();
  },
  async remove(key: string): Promise<void> {
    await client.getStore().remove(key);
    await stronghold.save();
  },
  async getPrivateKey(): Promise<string | null> {
    return vault.get('privateKey');
  },
  async setPrivateKey(value: string): Promise<void> {
    return vault.set('privateKey', value);
  },
  async getSecretKey(userId: string): Promise<string | null> {
    return vault.get(`secretKey:${userId}`);
  },
  async setSecretKey(userId: string, value: string): Promise<void> {
    return vault.set(`secretKey:${userId}`, value);
  },
  async removeSecretKey(userId: string): Promise<void> {
    return vault.remove(`secretKey:${userId}`);
  },
  async destroy(): Promise<void> {
    await stronghold.unload();
    await remove(config.vaultName, { baseDir: BaseDirectory.AppLocalData });
  }
};
