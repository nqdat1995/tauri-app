import type { QueueJobRequest, AppSettings, ProjectRecord, ModelInfo } from "./types";

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

/**
 * Fetch available models from the AI provider's API.
 * Returns empty array if API key is missing or call fails.
 */
export async function listModels(provider: string, apiKey: string): Promise<ModelInfo[]> {
  return invokeCommand<ModelInfo[]>("list_models", { provider, apiKey });
}


// ─── Editor Commands ─────────────────────────────────────────────

import type { LoadEditorResponse, SaveEditorRequest, ProjectSummary } from "../pages/Editor/types";

/** Load a project for editing (project.json + subtitles.json) */
export async function loadEditorProject(projectId: string): Promise<LoadEditorResponse> {
  return invokeCommand<LoadEditorResponse>("load_editor_project", { projectId });
}

/** Save edited subtitles, style, and overlays to disk */
export async function saveEditorProject(projectId: string, request: SaveEditorRequest): Promise<void> {
  return invokeCommand<void>("save_editor_project", { projectId, request });
}

/** Get the most recently processed project ID */
export async function getRecentProject(): Promise<string | null> {
  return invokeCommand<string | null>("get_recent_project");
}

/** List all projects available for editing */
export async function listEditorProjects(): Promise<ProjectSummary[]> {
  return invokeCommand<ProjectSummary[]>("list_editor_projects");
}
