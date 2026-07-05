/**
 * Video Editor — Zustand Store
 * Unit 1: editor-store
 *
 * Central state management for the editor.
 * Uses mock data when Tauri is not available.
 */

import { create } from "zustand";
import type {
  EditorState,
  EditorActions,
  SubtitleCue,
  OverlayType,
  OverlayItem,
  OverlayConfig,
} from "./types";
import { MOCK_PROJECT } from "./mockData";
import { DEFAULT_STYLE, DEFAULT_OVERLAYS, PRESET_STYLES, MAX_OVERLAY_INSTANCES } from "./constants";
import { isTauriAvailable } from "../../lib/tauri";

// ─── Helper: Generate unique ID ──────────────────────────────────

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Helper: Get default config for overlay type ─────────────────

function getDefaultConfig(type: OverlayType): OverlayConfig {
  switch (type) {
    case "background_overlay":
      return { color: "#000000", opacity: 50 };
    case "blur":
      return { color: "#000000", opacity: 30 };
    case "mirror":
      return { rotate180: false };
    case "text":
      return { text: "Văn bản", fontFamily: "system-ui", fontSize: 18, color: "#ffffff", bgColor: "#000000", bgShape: "rounded", bgOpacity: 70 };
    case "logo":
      return { path: "", opacity: 100 };
    case "watermark":
      return { path: "", opacity: 50 };
  }
}

// ─── Helper: Get default size for overlay type ───────────────────

function getDefaultSize(type: OverlayType): { width: number; height: number } {
  switch (type) {
    case "background_overlay":
      return { width: 600, height: 400 };
    case "blur":
      return { width: 500, height: 350 };
    case "mirror":
      return { width: 500, height: 400 };
    case "text":
      return { width: 300, height: 50 };
    case "logo":
      return { width: 200, height: 100 };
    case "watermark":
      return { width: 150, height: 80 };
  }
}

// ─── Initial State ───────────────────────────────────────────────

const initialState: EditorState = {
  project: null,
  subtitles: [],
  activeStyle: DEFAULT_STYLE,
  overlays: DEFAULT_OVERLAYS,
  currentTime: 0,
  isPlaying: false,
  isDirty: false,
  isLoading: false,
  error: null,
};

// ─── Store Definition ────────────────────────────────────────────

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  ...initialState,

  // ─── Project Lifecycle ───────────────────────────────────────

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      if (isTauriAvailable()) {
        // Import dynamically to avoid issues in non-Tauri environments
        const { loadEditorProject } = await import("../../lib/tauri");
        const response = await loadEditorProject(projectId);

        if (response.videoMissing) {
          set({
            isLoading: false,
            error: "VIDEO_MISSING",
            project: response.project,
          });
          return;
        }

        // Convert video path to asset:// URL for browser playback
        let videoUrl = response.project.videoPath;
        if (videoUrl && !videoUrl.startsWith("asset://") && !videoUrl.startsWith("http")) {
          try {
            const { toAssetUrl } = await import("../../lib/tauri");
            videoUrl = await toAssetUrl(videoUrl);
          } catch {
            // non-fatal — video preview will just not work
          }
        }

        set({
          project: { ...response.project, videoPath: videoUrl },
          subtitles: response.project.subtitles,
          activeStyle: response.project.activeStyle,
          overlays: response.project.overlays,
          currentTime: 0,
          isPlaying: false,
          isDirty: false,
          isLoading: false,
          error: null,
        });
      } else {
        // Mock mode: use mock data
        await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate loading
        set({
          project: MOCK_PROJECT,
          subtitles: MOCK_PROJECT.subtitles,
          activeStyle: MOCK_PROJECT.activeStyle,
          overlays: MOCK_PROJECT.overlays,
          currentTime: 0,
          isPlaying: false,
          isDirty: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  loadRecentProject: async () => {
    set({ isLoading: true, error: null });

    try {
      if (isTauriAvailable()) {
        const { getRecentProject } = await import("../../lib/tauri");
        const projectId = await getRecentProject();
        if (projectId) {
          await get().loadProject(projectId);
        } else {
          set({ isLoading: false, error: "NO_PROJECTS" });
        }
      } else {
        // Mock mode: load mock project
        await get().loadProject(MOCK_PROJECT.id);
      }
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  saveProject: async () => {
    const { project, subtitles, activeStyle, overlays } = get();
    if (!project) return;

    set({ isLoading: true, error: null });

    try {
      if (isTauriAvailable()) {
        const { saveEditorProject } = await import("../../lib/tauri");
        await saveEditorProject(project.id, {
          subtitles,
          style: activeStyle,
          overlays,
        });
      } else {
        // Mock mode: simulate save
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log("[mock] Project saved:", project.id);
      }

      set({ isDirty: false, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  // ─── Subtitle CRUD ──────────────────────────────────────────

  updateSubtitle: (id, field, value) => {
    set((state) => ({
      subtitles: state.subtitles.map((cue) =>
        cue.id === id ? { ...cue, [field]: value } : cue
      ),
      isDirty: true,
    }));
  },

  addSubtitle: (afterId?: string) => {
    const { subtitles, currentTime, project } = get();
    const duration = project?.duration ?? 60;

    let insertIndex = subtitles.length;
    let startTime = currentTime;

    if (afterId) {
      const afterIndex = subtitles.findIndex((c) => c.id === afterId);
      if (afterIndex >= 0) {
        insertIndex = afterIndex + 1;
        startTime = subtitles[afterIndex].endTime;
      }
    }

    const newCue: SubtitleCue = {
      id: generateId(),
      startTime,
      endTime: Math.min(startTime + 3, duration),
      originalText: "",
      translatedText: "",
      isNew: true,
    };

    const updated = [...subtitles];
    updated.splice(insertIndex, 0, newCue);

    set({ subtitles: updated, isDirty: true });
  },

  deleteSubtitle: (id) => {
    set((state) => ({
      subtitles: state.subtitles.filter((cue) => cue.id !== id),
      isDirty: true,
    }));
  },

  // ─── Style ──────────────────────────────────────────────────

  updateStyle: (updates) => {
    set((state) => ({
      activeStyle: { ...state.activeStyle, ...updates },
      isDirty: true,
    }));
  },

  selectPreset: (presetId) => {
    const preset = PRESET_STYLES.find((p) => p.id === presetId);
    if (preset) {
      set({ activeStyle: preset, isDirty: true });
    }
  },

  // ─── Overlay ────────────────────────────────────────────────

  addOverlay: (type: OverlayType) => {
    const { overlays } = get();
    const typeCount = overlays.items.filter((item) => item.type === type).length;

    if (typeCount >= (overlays.maxInstancesPerType || MAX_OVERLAY_INSTANCES)) {
      return; // Limit reached
    }

    const newItem: OverlayItem = {
      id: generateId(),
      type,
      enabled: true,
      config: getDefaultConfig(type),
      position: { x: (1920 - getDefaultSize(type).width) / 2, y: (1080 - getDefaultSize(type).height) / 2 },
      size: getDefaultSize(type),
    };

    set((state) => ({
      overlays: {
        ...state.overlays,
        items: [...state.overlays.items, newItem],
      },
      isDirty: true,
    }));
  },

  removeOverlay: (id) => {
    set((state) => ({
      overlays: {
        ...state.overlays,
        items: state.overlays.items.filter((item) => item.id !== id),
      },
      isDirty: true,
    }));
  },

  updateOverlay: (id, updates) => {
    set((state) => ({
      overlays: {
        ...state.overlays,
        items: state.overlays.items.map((item) => {
          if (item.id !== id) return item;
          const merged = { ...item, ...updates };
          // Auto-resize text overlays when fontSize or text content changes
          if (merged.type === "text" && updates.config) {
            const cfg = merged.config as { text?: string; fontSize?: number };
            const fontSize = cfg.fontSize ?? 18;
            const text = cfg.text || "Văn bản";
            // Estimate width: ~0.6em per character, height: fontSize + padding
            const charWidth = fontSize * 0.62;
            const estimatedWidth = Math.max(100, Math.min(1800, text.length * charWidth + 40));
            const estimatedHeight = Math.max(40, fontSize * 2.2);
            merged.size = { width: Math.round(estimatedWidth), height: Math.round(estimatedHeight) };
            // Clamp position so overlay stays within 1920x1080 bounds
            const maxX = 1920 - merged.size.width;
            const maxY = 1080 - merged.size.height;
            merged.position = {
              x: Math.max(0, Math.min(merged.position.x, maxX)),
              y: Math.max(0, Math.min(merged.position.y, maxY)),
            };
          }
          return merged;
        }),
      },
      isDirty: true,
    }));
  },

  toggleOverlay: (id) => {
    set((state) => ({
      overlays: {
        ...state.overlays,
        items: state.overlays.items.map((item) =>
          item.id === id ? { ...item, enabled: !item.enabled } : item
        ),
      },
      isDirty: true,
    }));
  },

  // ─── Playback Control ───────────────────────────────────────

  setCurrentTime: (time) => set({ currentTime: time }),
  seekTo: (time) => set({ currentTime: time }),
  setPlaying: (playing) => set({ isPlaying: playing }),

  // ─── Utility ────────────────────────────────────────────────

  resetDirty: () => set({ isDirty: false }),
  clearError: () => set({ error: null }),
}));

// ─── Derived State Selectors ─────────────────────────────────────

/** Get the currently active subtitle cue based on currentTime */
export function useActiveCue(): SubtitleCue | undefined {
  return useEditorStore((state) => {
    const { subtitles, currentTime } = state;
    return subtitles.find(
      (cue) => currentTime >= cue.startTime && currentTime < cue.endTime
    );
  });
}

/** Check if a specific overlay type has reached its max instances */
export function useOverlayTypeCount(type: OverlayType): number {
  return useEditorStore((state) =>
    state.overlays.items.filter((item) => item.type === type).length
  );
}
