use base64::{engine::general_purpose, Engine as _};
use chacha20poly1305::{
    aead::{Aead, AeadCore, KeyInit},
    ChaCha20Poly1305,
};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use rand::rngs::OsRng;
use tauri_plugin_keyring_store::KeyringStore;

const SERVICE: &str = "zenith";
const PRIVATE_KEY: &str = "private_key";
const PUBLIC_KEY: &str = "public_key";
const SECRET_KEY: &str = "secret_key";

fn store() -> KeyringStore {
    KeyringStore::new(SERVICE)
}

pub fn init_keys() -> Result<(), String> {
    let store = store();

    if store
        .get_password(PRIVATE_KEY)
        .map_err(|e| e.to_string())?
        .is_none()
    {
        let signing_key = SigningKey::generate(&mut OsRng);
        let verifying_key = signing_key.verifying_key();
        store
            .set_password(
                PRIVATE_KEY,
                &general_purpose::STANDARD.encode(signing_key.to_bytes()),
            )
            .map_err(|e| e.to_string())?;
        store
            .set_password(
                PUBLIC_KEY,
                &general_purpose::STANDARD.encode(verifying_key.to_bytes()),
            )
            .map_err(|e| e.to_string())?;
    }

    if store
        .get_password(SECRET_KEY)
        .map_err(|e| e.to_string())?
        .is_none()
    {
        let key = ChaCha20Poly1305::generate_key(&mut OsRng);
        store
            .set_password(SECRET_KEY, &general_purpose::STANDARD.encode(&key[..]))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_public_key() -> Result<String, String> {
    store()
        .get_password(PUBLIC_KEY)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Public key not found".to_string())
}

#[tauri::command]
pub fn set_secret_key(key: Vec<u8>) -> Result<(), String> {
    if key.len() != 32 {
        return Err(format!("Secret key must be 32 bytes, got {}", key.len()));
    }
    store()
        .set_password(SECRET_KEY, &general_purpose::STANDARD.encode(&key))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn sign(data: String) -> Result<String, String> {
    let b64 = store()
        .get_password(PRIVATE_KEY)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Private key not found".to_string())?;

    let bytes = general_purpose::STANDARD
        .decode(&b64)
        .map_err(|e| e.to_string())?;
    let array: [u8; 32] = bytes
        .try_into()
        .map_err(|_| "Invalid private key length".to_string())?;
    let signature = SigningKey::from_bytes(&array).sign(data.as_bytes());

    Ok(general_purpose::STANDARD.encode(signature.to_bytes()))
}

#[tauri::command]
pub fn verify(data: String, signature: String) -> Result<bool, String> {
    let b64 = store()
        .get_password(PUBLIC_KEY)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Public key not found".to_string())?;

    let bytes = general_purpose::STANDARD
        .decode(&b64)
        .map_err(|e| e.to_string())?;
    let array: [u8; 32] = bytes
        .try_into()
        .map_err(|_| "Invalid public key length".to_string())?;
    let verifying_key = VerifyingKey::from_bytes(&array).map_err(|e| e.to_string())?;

    let sig_bytes = general_purpose::STANDARD
        .decode(&signature)
        .map_err(|e| e.to_string())?;
    let sig_array: [u8; 64] = sig_bytes
        .try_into()
        .map_err(|_| "Invalid signature length".to_string())?;

    Ok(verifying_key
        .verify(data.as_bytes(), &Signature::from_bytes(&sig_array))
        .is_ok())
}

#[tauri::command]
pub fn encrypt(data: String) -> Result<String, String> {
    let b64 = store()
        .get_password(SECRET_KEY)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Secret key not found".to_string())?;

    let key_bytes = general_purpose::STANDARD
        .decode(&b64)
        .map_err(|e| e.to_string())?;
    let cipher = ChaCha20Poly1305::new_from_slice(&key_bytes).map_err(|e| e.to_string())?;
    let nonce = ChaCha20Poly1305::generate_nonce(&mut OsRng);

    let mut output = nonce.to_vec();
    output.extend(
        cipher
            .encrypt(&nonce, data.as_bytes())
            .map_err(|e| e.to_string())?,
    );

    Ok(general_purpose::STANDARD.encode(&output))
}

#[tauri::command]
pub fn delete_keys() -> Result<(), String> {
    let store = store();
    for account in [PRIVATE_KEY, PUBLIC_KEY, SECRET_KEY] {
        store.delete(account).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn decrypt(data: String) -> Result<String, String> {
    let b64 = store()
        .get_password(SECRET_KEY)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Secret key not found".to_string())?;

    let key_bytes = general_purpose::STANDARD
        .decode(&b64)
        .map_err(|e| e.to_string())?;
    let cipher = ChaCha20Poly1305::new_from_slice(&key_bytes).map_err(|e| e.to_string())?;

    let raw = general_purpose::STANDARD
        .decode(&data)
        .map_err(|e| e.to_string())?;
    if raw.len() < 12 {
        return Err("Ciphertext too short".to_string());
    }

    let (nonce_bytes, ciphertext) = raw.split_at(12);
    let nonce_arr: [u8; 12] = nonce_bytes
        .try_into()
        .map_err(|_| "Invalid nonce length".to_string())?;
    let plaintext = cipher
        .decrypt(&nonce_arr.into(), ciphertext)
        .map_err(|_| "Decryption failed — wrong key or corrupted data".to_string())?;

    String::from_utf8(plaintext).map_err(|e| e.to_string())
}
