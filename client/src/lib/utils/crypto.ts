import { invoke } from "@tauri-apps/api/core";

export const crypto = {
  getPublicKey(): Promise<string> {
    return invoke("get_public_key");
  },

  setSecretKey(key: number[]): Promise<void> {
    return invoke("set_secret_key", { key });
  },

  sign(data: string): Promise<string> {
    return invoke("sign", { data });
  },

  verify(data: string, signature: string): Promise<boolean> {
    return invoke("verify", { data, signature });
  },

  encrypt(data: string): Promise<string> {
    return invoke("encrypt", { data });
  },

  decrypt(data: string): Promise<string> {
    return invoke("decrypt", { data });
  },

  deleteKeys(): Promise<void> {
    return invoke("delete_keys");
  },
};
