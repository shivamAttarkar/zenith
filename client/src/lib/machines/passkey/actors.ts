import { authClient } from '$lib/auth';
import { settings } from '$lib/persistance/settings';
import { get } from 'svelte/store';
import { fromPromise } from 'xstate';

export const registerPasskey = fromPromise(async () => {
  const { data, error } = await authClient.passkey.addPasskey();
  if (error) {
    throw error;
  }
  return data;
});

export const checkPasskey = fromPromise(async () => {
  const { data, error } = await authClient.passkey.listUserPasskeys();
  if (error) {
    throw error;
  } else if (data === null || data.length === 0) {
    if (get(settings).passkeyRegistered) {
      await settings.update((prev) => ({ ...prev, passkeyRegistered: false }));
    }
    return false;
  }
  return true;
});
