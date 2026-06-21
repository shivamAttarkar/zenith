export async function deriveChallenge(
  senderPublicKey: string,
  receiverPublicKey: string,
  requestId: string,
): Promise<string> {
  const enc = new TextEncoder();
  const senderBytes = enc.encode(senderPublicKey);
  const receiverBytes = enc.encode(receiverPublicKey);
  const ikm = new Uint8Array(senderBytes.length + receiverBytes.length);
  ikm.set(senderBytes, 0);
  ikm.set(receiverBytes, senderBytes.length);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    ikm,
    { name: "HKDF" },
    false,
    ["deriveBits"],
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode(requestId),
      info: enc.encode("friend-request"),
    },
    keyMaterial,
    256,
  );

  const bytes = new Uint8Array(derived);
  const base64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
