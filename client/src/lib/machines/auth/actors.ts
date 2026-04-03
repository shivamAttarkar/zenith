import { authClient } from '$lib/auth';
import { fromPromise } from 'xstate';
import type { EmailLoginParams, EmailSignupParams } from './types';

export const emailLogin = fromPromise(async ({ input }: { input: EmailLoginParams }) => {
  const { data, error } = await authClient.signIn.email(input);
  if (error) {
    throw error;
  }
  return data;
});

export const emailSignup = fromPromise(async ({ input }: { input: EmailSignupParams }) => {
  const { data, error } = await authClient.signUp.email(input);
  if (error) {
    throw error;
  }
  return data;
});

export const passkeyLogin = fromPromise(async () => {
  const { data, error } = await authClient.signIn.passkey();
  if (error) {
    throw error;
  }
  return data;
});
