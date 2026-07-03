use std::sync::Mutex;

/// Holds the port and PID of the running sidecar process.
#[derive(Debug, Clone)]
pub struct SidecarState {
    pub port: u16,
    pub _pid: u32,
}

/// Persistent application data stored on disk.
#[derive(Default, serde::Serialize, serde::Deserialize)]
pub struct AppData {
    pub projects: Vec<String>,
}

/// Shared application state managed by Tauri.
/// Declared here but queue type uses UploadJob from job::models.
/// To avoid a circular dependency (state → job → state), AppState is defined
/// after job module declaration and uses the fully-qualified path.
pub struct AppState {
    pub sidecar_state: Mutex<Option<SidecarState>>,
    /// Held by the thread currently starting the sidecar to prevent double-spawn.
    pub sidecar_starting: Mutex<bool>,
    pub queue: Mutex<Vec<crate::job::models::UploadJob>>,
    pub processing: Mutex<bool>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            sidecar_state: Mutex::new(None),
            sidecar_starting: Mutex::new(false),
            queue: Mutex::new(Vec::new()),
            processing: Mutex::new(false),
        }
    }
}
