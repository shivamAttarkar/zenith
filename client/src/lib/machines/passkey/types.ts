export type PasskeyContext = {
  error: string | null;
};

export type PasskeyEvents =
  | { type: 'registerPasskey' }
  | { type: 'useExistingPasskey' }
  | { type: 'retry' };
