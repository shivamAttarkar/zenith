import { fromCallback, fromPromise } from 'xstate';
import { settings } from '$lib/persistance/settings';
import { vault } from '$lib/persistance/vault';
import { migrate } from '$lib/db/migrate';
import { generateECDHKeys } from '$lib/utils/crypto';
import { base64url } from 'jose';
import { get } from 'svelte/store';
import { client } from '$lib/client';
import { authClient } from '$lib/auth';

export const initializeApp = fromPromise(async () => {
  await Promise.all([migrate(), settings.init(), vault.init()]);
});

export const getSession = fromPromise(async () => {
  const session = await authClient.getSession();
  if (session.error) {
    return null;
  }
  return session.data;
});

export const logout = fromPromise(async () => {
  const { error } = await authClient.signOut();
  if (error) throw error;
});

export const sessionWatcher = fromCallback(({ sendBack }) => {
  const unsub = authClient.useSession().subscribe((session) => {
    if (!session.isPending && session.data === null) {
      sendBack({ type: 'logout' });
    }
  });
  return unsub;
});

export const setECDHKeys = fromPromise(async () => {
  const [privateKeyExists, { data: serverKey, error: fetchError }] = await Promise.all([
    vault.hasPrivateKey(),
    client.api.v1['public-key'].get()
  ]);

  if (fetchError) {
    throw fetchError;
  }
  if (privateKeyExists && serverKey?.publicKey) {
    const { publicKey } = get(settings);
    if (publicKey === serverKey.publicKey) {
      return;
    }
  }

  const keys = await generateECDHKeys();
  const [pubRaw, privRaw] = await Promise.all([
    crypto.subtle.exportKey('spki', keys.publicKey),
    crypto.subtle.exportKey('pkcs8', keys.privateKey)
  ]);

  const publicKey = base64url.encode(new Uint8Array(pubRaw));
  const privateKey = base64url.encode(new Uint8Array(privRaw));

  const { error: upsertError } = await (serverKey?.publicKey
    ? client.api.v1['public-key'].put({ publicKey })
    : client.api.v1['public-key'].post({ publicKey }));
  if (upsertError) throw upsertError;

  await Promise.all([
    settings.update((prev) => ({ ...prev, publicKey, ecdhKeysPresent: true })),
    vault.setPrivateKey(privateKey)
  ]);
});
