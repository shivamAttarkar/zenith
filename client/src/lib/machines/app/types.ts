import { authClient } from '$lib/auth';

export type AppContext = {
  session: typeof authClient.$Infer.Session | null;
  error: string | null;
};

export type AppEvents = { type: 'retry' } | { type: 'logout' };
