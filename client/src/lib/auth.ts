import { createAuthClient } from 'better-auth/svelte';
import { passkeyClient } from '@better-auth/passkey/client';
import { config } from './config';
export const authClient = createAuthClient({
  baseURL: config.backendURL,
  plugins: [passkeyClient()]
});
