use tauri::Manager;
mod crypto;

#[cfg(target_os = "android")]
mod android;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            crypto::init_keys()?;
            // desktop needs a delay for the webview to load before showing
            #[cfg(not(target_os = "android"))]
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(4000));
                let _ = window.show();
            });
            #[cfg(target_os = "android")]
            let _ = window.show();
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            crypto::get_public_key,
            crypto::set_secret_key,
            crypto::sign,
            crypto::verify,
            crypto::encrypt,
            crypto::decrypt,
            crypto::delete_keys,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
