use std::net::TcpListener;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;

use crate::state::{AppState, SidecarState};

/// Returns the sidecar port, starting it if not already running.
/// Safe to call from multiple threads — only one thread will spawn the process.
pub fn ensure_sidecar_running_pub(app: &AppHandle, state: &Arc<AppState>) -> Result<u16, String> {
    ensure_sidecar_running(app, state)
}

pub fn ensure_sidecar_running(_app: &AppHandle, state: &Arc<AppState>) -> Result<u16, String> {
    // Fast path: sidecar already running
    if let Some(ref sidecar) = *state.sidecar_state.lock().map_err(|e| e.to_string())? {
        return Ok(sidecar.port);
    }

    // Slow path: acquire the "starting" lock so only one thread spawns the sidecar.
    let mut starting = state.sidecar_starting.lock().map_err(|e| e.to_string())?;

    // Re-check after acquiring the lock — another thread may have started it already.
    if let Some(ref sidecar) = *state.sidecar_state.lock().map_err(|e| e.to_string())? {
        return Ok(sidecar.port);
    }

    *starting = true;

    let port = bind_free_port()?;
    eprintln!("[sidecar] Spawning on port {port}");
    let child = spawn_sidecar_process(port)?;
    let pid = child.id();
    std::mem::forget(child);

    // Wait up to 30 s for the sidecar to become healthy (PyInstaller is slow on Windows)
    wait_for_sidecar_health(port, 30_000)?;
    eprintln!("[sidecar] Ready on port {port} (pid {pid})");

    *state.sidecar_state.lock().map_err(|e| e.to_string())? =
        Some(SidecarState { port, _pid: pid });
    *starting = false;

    Ok(port)
}

fn bind_free_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let addr = listener.local_addr().map_err(|e| e.to_string())?;
    drop(listener);
    Ok(addr.port())
}

fn find_sidecar_executable() -> Option<PathBuf> {
    let names = if cfg!(windows) {
        vec!["tauri-sidecar-app.exe", "tauri-sidecar-app"]
    } else {
        vec!["tauri-sidecar-app"]
    };

    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(cwd) = std::env::current_dir() {
        for name in &names {
            candidates.push(cwd.join(name));
        }
    }

    if let Ok(exe_path) = std::env::current_exe() {
        let mut dir = exe_path.parent();
        while let Some(parent) = dir {
            for name in &names {
                candidates.push(parent.join(name));
            }
            dir = parent.parent();
        }
    }

    for path in candidates {
        if path.exists() && path.is_file() {
            return Some(path);
        }
    }
    None
}

fn spawn_sidecar_process(port: u16) -> Result<Child, String> {
    // Point the sidecar's temp dir to the OS temp folder so it never writes inside
    // the source tree and does not trigger the Tauri dev watcher.
    let temp_dir = std::env::temp_dir().join("tauri-sidecar-app");
    let temp_dir_str = temp_dir.to_string_lossy().into_owned();

    if let Some(path) = find_sidecar_executable() {
        let mut command = Command::new(path);
        command
            .arg("--port")
            .arg(port.to_string())
            .env("FASTER_WHISPER_TEMP_DIR", &temp_dir_str)
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        return command.spawn().map_err(|e| e.to_string());
    }

    let candidates: Vec<&str> = if cfg!(windows) {
        vec!["tauri-sidecar-app.exe", "tauri-sidecar-app"]
    } else {
        vec!["tauri-sidecar-app"]
    };

    let mut last_not_found = None;
    for command_name in candidates.iter() {
        let mut command = Command::new(command_name);
        command
            .arg("--port")
            .arg(port.to_string())
            .env("FASTER_WHISPER_TEMP_DIR", &temp_dir_str)
            .stdout(Stdio::null())
            .stderr(Stdio::null());

        match command.spawn() {
            Ok(child) => return Ok(child),
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
                last_not_found = Some(err);
                continue;
            }
            Err(err) => return Err(err.to_string()),
        }
    }

    if last_not_found.is_some() {
        spawn_python_sidecar(port, &temp_dir_str)
    } else {
        Err("Failed to start tauri-sidecar-app or python runtime.".to_string())
    }
}

fn find_sidecar_script() -> Option<PathBuf> {
    let name = "tauri-sidecar-app.py";

    if let Ok(cwd) = std::env::current_dir() {
        let candidate = cwd.join(name);
        if candidate.exists() && candidate.is_file() {
            return Some(candidate);
        }
    }

    if let Ok(exe_path) = std::env::current_exe() {
        let mut dir = exe_path.parent();
        while let Some(parent) = dir {
            let candidate = parent.join(name);
            if candidate.exists() && candidate.is_file() {
                return Some(candidate);
            }
            dir = parent.parent();
        }
    }

    None
}

fn spawn_python_sidecar(port: u16, temp_dir: &str) -> Result<Child, String> {
    let script = find_sidecar_script().ok_or_else(|| {
        "Failed to start tauri-sidecar-app or python runtime. Ensure Python is installed and tauri-sidecar-app.py is available.".to_string()
    })?;

    let python_executables = ["python3", "python"];
    for exe in python_executables {
        let mut command = Command::new(exe);
        command
            .arg(script.clone())
            .arg("--port")
            .arg(port.to_string())
            .env("FASTER_WHISPER_TEMP_DIR", temp_dir)
            .stdout(Stdio::null())
            .stderr(Stdio::null());

        if let Ok(child) = command.spawn() {
            return Ok(child);
        }
    }

    Err("Failed to start tauri-sidecar-app or python runtime. Ensure Python is installed and tauri-sidecar-app.py is available.".to_string())
}

pub fn wait_for_sidecar_health(port: u16, timeout_ms: u64) -> Result<(), String> {
    let url = format!("http://127.0.0.1:{}/health", port);
    let interval_ms = 500u64;
    let attempts = (timeout_ms / interval_ms).max(1);
    let mut last_error = None;
    for _ in 0..attempts {
        match ureq::get(&url).call() {
            Ok(response) => {
                if response.status() == 200 {
                    if let Ok(body) = response.into_string() {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
                            if json.get("status").and_then(|v| v.as_str()) == Some("ok") {
                                return Ok(());
                            }
                        }
                    }
                }
            }
            Err(err) => {
                last_error = Some(err.to_string());
            }
        }
        thread::sleep(Duration::from_millis(interval_ms));
    }
    Err(format!(
        "Sidecar did not become healthy within {}ms: {}",
        timeout_ms,
        last_error.unwrap_or_else(|| "no response".to_string())
    ))
}
