import { base64url } from 'jose';

export const deriveChallenge = async (
  senderPublicKey: string,
  receiverPublicKey: string,
  requestId: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const seed = new Uint8Array([
    ...encoder.encode(senderPublicKey),
    ...encoder.encode(receiverPublicKey)
  ]);
  const keyMaterial = await crypto.subtle.importKey('raw', seed, { name: 'HKDF' }, false, [
    'deriveBits'
  ]);
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(requestId),
      info: encoder.encode('friend-request')
    },
    keyMaterial,
    256
  );
  return base64url.encode(new Uint8Array(derived));
};

export const generateECDHKeys = async () => {
  return await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveKey'
  ]);
};

export const generateSecretKey = async ({
  publicKey,
  privateKey
}: {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}) => {
  return await crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};
