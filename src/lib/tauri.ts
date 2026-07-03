import type { QueueJobRequest, AppSettings, ProjectRecord } from "./types";

export async function invokeCommand<T = unknown>(cmd: string, args?: Record<string, unknown>) {
  if (typeof window === "undefined" || !(window as any).__TAURI__) {
    throw new Error("Tauri is not available in this environment.");
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args ?? {});
}

export async function enqueueJob(request: QueueJobRequest) {
  return invokeCommand<string>("enqueue_job", { request });
}

export async function cancelPendingJobs() {
  return invokeCommand<number>("cancel_pending_jobs");
}

export async function getFileMetadata(path: string): Promise<{ size: number }> {
  return invokeCommand<{ size: number }>("get_file_metadata", { path });
}

export async function toAssetUrl(filePath: string): Promise<string> {
  const { convertFileSrc } = await import("@tauri-apps/api/core");
  return convertFileSrc(filePath);
}

export async function chooseVideoFiles(): Promise<string[]> {
  const options = {
    multiple: true,
    directory: false,
    filters: [
      { name: "Video", extensions: ["mp4", "mov", "mkv", "webm", "avi", "flv", "wmv"] },
    ],
  };

  const result = await invokeCommand<unknown>("plugin:dialog|open", { options });

  if (result == null) {
    return [];
  }
  if (Array.isArray(result)) {
    return result.filter((item): item is string => typeof item === "string");
  }
  if (typeof result === "string") {
    return [result];
  }
  if (typeof result === "object") {
    if (Array.isArray((result as any).files)) {
      return (result as any).files.filter((item: unknown): item is string => typeof item === "string");
    }
    if (typeof (result as any).file === "string") {
      return [(result as any).file];
    }
  }
  return [];
}

export function isTauriAvailable(): boolean {
  return typeof window !== "undefined" && !!(window as any).__TAURI__;
}

/** Load settings from ~/.tauri-translate-app/settings.json */
export async function loadSettings(): Promise<AppSettings> {
  return invokeCommand<AppSettings>("load_settings");
}

/** Persist settings to ~/.tauri-translate-app/settings.json */
export async function saveSettings(settings: AppSettings): Promise<void> {
  return invokeCommand<void>("save_settings", { settings });
}

/**
 * Load project history: reads app_data.json for IDs then loads each
 * project file from ~/.tauri-translate-app/projects/{id}.json
 */
export async function loadHistory(): Promise<ProjectRecord[]> {
  return invokeCommand<ProjectRecord[]>("load_history");
}
