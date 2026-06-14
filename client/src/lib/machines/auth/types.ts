export type EmailLoginParams = {
  email: string;
  password: string;
};

export type EmailSignupParams = EmailLoginParams & {
  name: string;
};

export type AuthContext = { error: string | null };

export type AuthEvents =
  | ({ type: 'login' } & EmailLoginParams)
  | ({ type: 'signup' } & EmailSignupParams)
  | { type: 'moveToSignup' }
  | { type: 'moveToLogin' }
  | { type: 'loginWithPasskey' };
