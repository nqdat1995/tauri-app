/**
 * Video Editor — Zustand Store (Refactored)
 *
 * Project Model is the Single Source of Truth.
 * Compatibility selectors expose legacy shapes for existing components.
 * Migration adapters handle load/save with unchanged backend.
 */

import { create } from "zustand";
import type {
  Project,
  EditorObject,
  ObjectType,
  ObjectConfig,
  EditorStyle,
  Asset,
  SubtitleConfig,
  TextOverlayConfig,
  LogoOverlayConfig,
  WatermarkOverlayConfig,
} from "./model/types";
import type { Viewport } from "./viewport/types";
import {
  generateId,
  createObject,
  createTransform,
  getDefaultConfig,
  getDefaultSize,
  getDefaultPosition,
  PRESET_SUBTITLE_STYLES,
  DEFAULT_TEXT_STYLE,
} from "./model/defaults";
import { createViewport } from "./viewport/viewport";
import { legacyToProject, projectToLegacy } from "./adapter/legacy";
import { isTauriAvailable } from "../../lib/tauri";

// Re-export old types for components not yet migrated
import type {
  SubtitleCue,
  OverlayType,
  OverlayItem,
  SubtitleStyle,
  EditorProject,
  EditorState,
  EditorActions,
} from "./types";
import { MOCK_PROJECT } from "./mockData";
import { DEFAULT_STYLE, DEFAULT_OVERLAYS, PRESET_STYLES, MAX_OVERLAY_INSTANCES } from "./constants";

// ─── Internal Store State ────────────────────────────────────────

interface InternalState {
  /** The Project Model — Single Source of Truth */
  _project: Project | null;

  /** Viewport state (ephemeral) */
  viewport: Viewport;

  /** Playback state (ephemeral) */
  currentTime: number;
  isPlaying: boolean;

  /** UI state */
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  selectedObjectId: string | null;

  /** Legacy compatibility: original video URL for playback */
  _videoUrl: string;
}

// ─── Compatibility Layer (derives legacy shapes from Project) ────

function projectToLegacyProject(project: Project | null, videoUrl: string): EditorProject | null {
  if (!project) return null;

  const { metadata, objects, styles, settings, assets } = project;

  // Derive subtitles
  const subtitles: SubtitleCue[] = objects
    .filter((o) => o.type === "subtitle")
    .map((o) => {
      const cfg = o.config as SubtitleConfig;
      return {
        id: o.id,
        startTime: o.startTime,
        endTime: o.endTime,
        originalText: cfg.originalText,
        translatedText: cfg.translatedText,
        isNew: cfg.isNew,
      };
    });

  // Derive active style
  const activeStyleObj = styles.find((s) => s.id === settings.defaultSubtitleStyleId);
  const activeStyle: SubtitleStyle = activeStyleObj
    ? {
        id: activeStyleObj.id,
        name: activeStyleObj.name,
        fontFamily: activeStyleObj.fontFamily,
        fontSize: activeStyleObj.fontSize,
        textColor: activeStyleObj.textColor,
        bgColor: activeStyleObj.bgColor,
        bgShape: activeStyleObj.bgShape,
        position: activeStyleObj.position,
        bgOpacity: activeStyleObj.bgOpacity,
      }
    : DEFAULT_STYLE;

  // Derive overlays
  const overlayItems: OverlayItem[] = objects
    .filter((o) => o.type !== "subtitle")
    .map((o) => {
      const legacyConfig = objectToLegacyConfig(o, styles, assets);
      return {
        id: o.id,
        type: o.type as OverlayType,
        enabled: o.enabled,
        config: legacyConfig as OverlayItem["config"],
        position: {
          x: o.transform.position?.x ?? 0,
          y: o.transform.position?.y ?? 0,
        },
        size: {
          width: o.transform.size.width,
          height: o.transform.size.height,
        },
      };
    });

  return {
    id: metadata.id,
    filename: metadata.name,
    duration: metadata.duration,
    fileSize: metadata.fileSize,
    width: metadata.width,
    height: metadata.height,
    processingTime: metadata.processingTime,
    status: metadata.status as "has_subtitle" | "processing" | "ready",
    videoPath: videoUrl,
    subtitles,
    activeStyle,
    overlays: {
      maxInstancesPerType: MAX_OVERLAY_INSTANCES,
      items: overlayItems,
    },
  };
}

function objectToLegacyConfig(
  obj: EditorObject,
  styles: EditorStyle[],
  assets: Asset[]
): Record<string, unknown> {
  switch (obj.type) {
    case "background_overlay": {
      const cfg = obj.config as { color: string; opacity: number };
      return { color: cfg.color, opacity: cfg.opacity };
    }
    case "blur": {
      const cfg = obj.config as { color: string; opacity: number };
      return { color: cfg.color, opacity: cfg.opacity };
    }
    case "mirror": {
      const cfg = obj.config as { rotate180: boolean };
      return { rotate180: cfg.rotate180 };
    }
    case "text": {
      const cfg = obj.config as TextOverlayConfig;
      const style = obj.styleId ? styles.find((s) => s.id === obj.styleId) : null;
      return {
        text: cfg.text,
        fontFamily: style?.fontFamily ?? "system-ui",
        fontSize: style?.fontSize ?? 18,
        color: style?.textColor ?? "#ffffff",
        bgColor: style?.bgColor ?? "#000000",
        bgShape: style?.bgShape ?? "rounded",
        bgOpacity: style?.bgOpacity ?? 70,
        startTime: obj.startTime,
        endTime: obj.endTime,
      };
    }
    case "logo":
    case "watermark": {
      const cfg = obj.config as LogoOverlayConfig | WatermarkOverlayConfig;
      const asset = assets.find((a) => a.id === cfg.assetId);
      return {
        path: asset?.source ?? "",
        opacity: cfg.opacity,
      };
    }
    default:
      return {};
  }
}

// ─── Store Definition ────────────────────────────────────────────

export const useEditorStore = create<EditorState & EditorActions & InternalState>((set, get) => ({
  // ─── Internal State ─────────────────────────────────────────
  _project: null,
  viewport: createViewport(),
  selectedObjectId: null,
  _videoUrl: "",

  // ─── Compatibility State (computed getters via selectors) ───
  // These are computed on-the-fly from _project for backward compat
  project: null,
  subtitles: [],
  activeStyle: DEFAULT_STYLE,
  overlays: DEFAULT_OVERLAYS,
  currentTime: 0,
  isPlaying: false,
  isDirty: false,
  isLoading: false,
  error: null,

  // ─── Project Lifecycle ───────────────────────────────────────

  loadProject: async (projectId: string) => {
    set({ isLoading: true, error: null });

    try {
      if (isTauriAvailable()) {
        const { loadEditorProject } = await import("../../lib/tauri");
        const response = await loadEditorProject(projectId);

        if (response.videoMissing) {
          // Convert to Project but set error
          const proj = legacyToProject(response.project);
          const compat = projectToLegacyProject(proj, "");
          set({
            isLoading: false,
            error: "VIDEO_MISSING",
            _project: proj,
            _videoUrl: "",
            project: compat,
            subtitles: compat?.subtitles ?? [],
            activeStyle: compat?.activeStyle ?? DEFAULT_STYLE,
            overlays: compat?.overlays ?? DEFAULT_OVERLAYS,
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
            // non-fatal
          }
        }

        // Convert legacy response → Project Model
        const proj = legacyToProject(response.project);
        // Update video asset source with converted URL
        const updatedAssets = proj.assets.map((a) =>
          a.type === "video" ? { ...a, source: videoUrl } : a
        );
        const finalProject = { ...proj, assets: updatedAssets };

        const compat = projectToLegacyProject(finalProject, videoUrl);

        set({
          _project: finalProject,
          _videoUrl: videoUrl,
          project: compat,
          subtitles: compat?.subtitles ?? [],
          activeStyle: compat?.activeStyle ?? DEFAULT_STYLE,
          overlays: compat?.overlays ?? DEFAULT_OVERLAYS,
          currentTime: 0,
          isPlaying: false,
          isDirty: false,
          isLoading: false,
          error: null,
        });
      } else {
        // Mock mode
        await new Promise((resolve) => setTimeout(resolve, 300));
        const proj = legacyToProject(MOCK_PROJECT);
        const compat = projectToLegacyProject(proj, "");

        set({
          _project: proj,
          _videoUrl: "",
          project: compat,
          subtitles: compat?.subtitles ?? [],
          activeStyle: compat?.activeStyle ?? DEFAULT_STYLE,
          overlays: compat?.overlays ?? DEFAULT_OVERLAYS,
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
    const { _project } = get();
    if (!_project) return;

    set({ isLoading: true, error: null });

    try {
      if (isTauriAvailable()) {
        const { saveEditorProject } = await import("../../lib/tauri");
        const legacySave = projectToLegacy(_project);
        // Cast: LegacySaveRequest is structurally compatible with SaveEditorRequest
        await saveEditorProject(_project.metadata.id, legacySave as unknown as import("./types").SaveEditorRequest);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log("[mock] Project saved:", _project.metadata.id);
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
    const { _project, _videoUrl } = get();
    if (!_project) return;

    const updatedObjects = _project.objects.map((obj) => {
      if (obj.id !== id || obj.type !== "subtitle") return obj;
      const cfg = obj.config as SubtitleConfig;
      let updated: EditorObject;
      if (field === "startTime" || field === "endTime") {
        updated = { ...obj, [field]: value as number };
      } else {
        updated = { ...obj, config: { ...cfg, [field]: value } };
      }
      return updated;
    });

    const updatedProject = { ..._project, objects: updatedObjects };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      subtitles: compat?.subtitles ?? [],
      isDirty: true,
    });
  },

  addSubtitle: (afterId?: string) => {
    const { _project, _videoUrl, currentTime } = get();
    if (!_project) return;

    const duration = _project.metadata.duration || 60;
    const subtitleObjects = _project.objects.filter((o) => o.type === "subtitle");

    let startTime = currentTime;
    let insertIndex = subtitleObjects.length;

    if (afterId) {
      const afterIdx = subtitleObjects.findIndex((o) => o.id === afterId);
      if (afterIdx >= 0) {
        insertIndex = afterIdx + 1;
        startTime = subtitleObjects[afterIdx].endTime;
      }
    }

    const newObj = createObject("subtitle", {
      startTime,
      endTime: Math.min(startTime + 3, duration),
      styleId: _project.settings.defaultSubtitleStyleId,
      config: { originalText: "", translatedText: "", isNew: true },
    });

    // Insert in correct position among all objects
    const nonSubtitles = _project.objects.filter((o) => o.type !== "subtitle");
    const newSubtitles = [...subtitleObjects];
    newSubtitles.splice(insertIndex, 0, newObj);

    const updatedObjects = [...newSubtitles, ...nonSubtitles];

    // Update subtitle track
    const updatedTracks = _project.tracks.map((t) =>
      t.type === "subtitle" ? { ...t, objectIds: newSubtitles.map((o) => o.id) } : t
    );

    const updatedProject = { ..._project, objects: updatedObjects, tracks: updatedTracks };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      subtitles: compat?.subtitles ?? [],
      isDirty: true,
    });
  },

  deleteSubtitle: (id) => {
    const { _project, _videoUrl } = get();
    if (!_project) return;

    const updatedObjects = _project.objects.filter((o) => o.id !== id);
    const updatedTracks = _project.tracks.map((t) =>
      t.type === "subtitle" ? { ...t, objectIds: t.objectIds.filter((oid) => oid !== id) } : t
    );

    const updatedProject = { ..._project, objects: updatedObjects, tracks: updatedTracks };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      subtitles: compat?.subtitles ?? [],
      isDirty: true,
    });
  },

  // ─── Style ──────────────────────────────────────────────────

  updateStyle: (updates) => {
    const { _project, _videoUrl } = get();
    if (!_project) return;

    const styleId = _project.settings.defaultSubtitleStyleId;
    const updatedStyles = _project.styles.map((s) =>
      s.id === styleId ? { ...s, ...updates } : s
    );

    const updatedProject = { ..._project, styles: updatedStyles };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      activeStyle: compat?.activeStyle ?? DEFAULT_STYLE,
      isDirty: true,
    });
  },

  selectPreset: (presetId) => {
    const { _project, _videoUrl } = get();
    if (!_project) return;

    // Find preset in new format
    const preset = PRESET_SUBTITLE_STYLES.find((p) => p.id === presetId);
    if (!preset) {
      // Fallback: try old presets
      const oldPreset = PRESET_STYLES.find((p) => p.id === presetId);
      if (oldPreset) {
        // Convert old preset to update current style
        const styleId = _project.settings.defaultSubtitleStyleId;
        const updatedStyles = _project.styles.map((s) =>
          s.id === styleId
            ? {
                ...s,
                name: oldPreset.name,
                fontFamily: oldPreset.fontFamily,
                fontSize: oldPreset.fontSize,
                textColor: oldPreset.textColor,
                bgColor: oldPreset.bgColor,
                bgShape: oldPreset.bgShape,
                bgOpacity: oldPreset.bgOpacity,
                position: oldPreset.position,
              }
            : s
        );
        const updatedProject = { ..._project, styles: updatedStyles };
        const compat = projectToLegacyProject(updatedProject, _videoUrl);
        set({
          _project: updatedProject,
          project: compat,
          activeStyle: compat?.activeStyle ?? DEFAULT_STYLE,
          isDirty: true,
        });
      }
      return;
    }

    // Replace the default subtitle style with the preset
    const styleId = _project.settings.defaultSubtitleStyleId;
    const updatedStyles = _project.styles.map((s) =>
      s.id === styleId ? { ...preset, id: styleId } : s
    );

    const updatedProject = { ..._project, styles: updatedStyles };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      activeStyle: compat?.activeStyle ?? DEFAULT_STYLE,
      isDirty: true,
    });
  },

  // ─── Overlay ────────────────────────────────────────────────

  addOverlay: (type: OverlayType) => {
    const { _project, _videoUrl, currentTime } = get();
    if (!_project) return;

    const overlayObjects = _project.objects.filter((o) => o.type !== "subtitle");
    const typeCount = overlayObjects.filter((o) => o.type === type).length;
    if (typeCount >= MAX_OVERLAY_INSTANCES) return;

    const duration = _project.metadata.duration || 60;
    const size = getDefaultSize(type as ObjectType);
    const position = getDefaultPosition(type as ObjectType);

    let startTime = 0;
    let endTime = duration;
    let styleId: string | null = null;
    let config: ObjectConfig;

    if (type === "text") {
      startTime = currentTime;
      endTime = Math.min(currentTime + 5, duration);
      config = { text: "Văn bản" } as TextOverlayConfig;

      // Create a text style
      const textStyle: EditorStyle = {
        ...DEFAULT_TEXT_STYLE,
        id: generateId(),
        name: "Chữ",
      };
      _project.styles.push(textStyle);
      styleId = textStyle.id;
    } else if (type === "logo" || type === "watermark") {
      config = { assetId: "", opacity: type === "logo" ? 100 : 50 };
    } else {
      config = getDefaultConfig(type as ObjectType);
    }

    const newObj = createObject(type as ObjectType, {
      startTime,
      endTime,
      styleId,
      config,
      transform: createTransform({ position, size }),
    });

    const updatedObjects = [..._project.objects, newObj];
    const updatedTracks = _project.tracks.map((t) =>
      t.type === "overlay" ? { ...t, objectIds: [...t.objectIds, newObj.id] } : t
    );

    const updatedProject = { ..._project, objects: updatedObjects, tracks: updatedTracks };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      overlays: compat?.overlays ?? DEFAULT_OVERLAYS,
      isDirty: true,
    });
  },

  removeOverlay: (id) => {
    const { _project, _videoUrl } = get();
    if (!_project) return;

    // Also remove associated style if it's a text overlay
    const obj = _project.objects.find((o) => o.id === id);
    let updatedStyles = _project.styles;
    if (obj?.styleId && obj.type === "text") {
      updatedStyles = _project.styles.filter((s) => s.id !== obj.styleId);
    }

    // Also remove associated asset if it's a logo/watermark
    let updatedAssets = _project.assets;
    if (obj && (obj.type === "logo" || obj.type === "watermark")) {
      const cfg = obj.config as LogoOverlayConfig | WatermarkOverlayConfig;
      if (cfg.assetId) {
        updatedAssets = _project.assets.filter((a) => a.id !== cfg.assetId);
      }
    }

    const updatedObjects = _project.objects.filter((o) => o.id !== id);
    const updatedTracks = _project.tracks.map((t) =>
      t.type === "overlay" ? { ...t, objectIds: t.objectIds.filter((oid) => oid !== id) } : t
    );

    const updatedProject = {
      ..._project,
      objects: updatedObjects,
      tracks: updatedTracks,
      styles: updatedStyles,
      assets: updatedAssets,
    };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      overlays: compat?.overlays ?? DEFAULT_OVERLAYS,
      isDirty: true,
    });
  },

  updateOverlay: (id, updates) => {
    const { _project, _videoUrl } = get();
    if (!_project) return;

    const updatedObjects = _project.objects.map((obj) => {
      if (obj.id !== id) return obj;

      let merged = { ...obj };

      // Update position
      if (updates.position) {
        merged.transform = {
          ...merged.transform,
          position: { x: updates.position.x, y: updates.position.y },
        };
      }

      // Update size
      if (updates.size) {
        merged.transform = {
          ...merged.transform,
          size: { width: updates.size.width, height: updates.size.height },
        };
      }

      // Update enabled
      if (updates.enabled !== undefined) {
        merged.enabled = updates.enabled;
      }

      // Update config
      if (updates.config) {
        if (merged.type === "text") {
          // Text overlay: update style + text content
          const textCfg = updates.config as Record<string, unknown>;
          const newText = textCfg.text as string | undefined;
          if (newText !== undefined) {
            merged.config = { ...(merged.config as TextOverlayConfig), text: newText };
          }

          // Update associated style with visual properties
          if (merged.styleId) {
            const styleUpdates: Partial<EditorStyle> = {};
            if (textCfg.fontFamily !== undefined) styleUpdates.fontFamily = textCfg.fontFamily as string;
            if (textCfg.fontSize !== undefined) styleUpdates.fontSize = textCfg.fontSize as number;
            if (textCfg.color !== undefined) styleUpdates.textColor = textCfg.color as string;
            if (textCfg.bgColor !== undefined) styleUpdates.bgColor = textCfg.bgColor as string;
            if (textCfg.bgShape !== undefined) styleUpdates.bgShape = textCfg.bgShape as "box" | "rounded" | "none";
            if (textCfg.bgOpacity !== undefined) styleUpdates.bgOpacity = textCfg.bgOpacity as number;

            if (Object.keys(styleUpdates).length > 0) {
              _project.styles = _project.styles.map((s) =>
                s.id === merged.styleId ? { ...s, ...styleUpdates } : s
              );
            }
          }

          // Update startTime/endTime
          if (textCfg.startTime !== undefined) merged.startTime = textCfg.startTime as number;
          if (textCfg.endTime !== undefined) merged.endTime = textCfg.endTime as number;

          // Auto-resize text overlays
          const cfg = merged.config as TextOverlayConfig;
          const style = merged.styleId ? _project.styles.find((s) => s.id === merged.styleId) : null;
          const fontSize = style?.fontSize ?? 18;
          const text = cfg.text || "Văn bản";
          const charWidth = fontSize * 0.62;
          const estimatedWidth = Math.max(100, Math.min(1800, text.length * charWidth + 40));
          const estimatedHeight = Math.max(40, fontSize * 2.2);
          merged.transform = {
            ...merged.transform,
            size: { width: Math.round(estimatedWidth), height: Math.round(estimatedHeight) },
          };
          // Clamp position
          const pos = merged.transform.position;
          if (pos) {
            merged.transform.position = {
              x: Math.max(0, Math.min(pos.x, 1920 - merged.transform.size.width)),
              y: Math.max(0, Math.min(pos.y, 1080 - merged.transform.size.height)),
            };
          }
        } else {
          // Non-text overlays: merge config directly
          merged.config = { ...merged.config, ...updates.config } as ObjectConfig;
        }
      }

      return merged;
    });

    const updatedProject = { ..._project, objects: updatedObjects };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      overlays: compat?.overlays ?? DEFAULT_OVERLAYS,
      isDirty: true,
    });
  },

  toggleOverlay: (id) => {
    const { _project, _videoUrl } = get();
    if (!_project) return;

    const updatedObjects = _project.objects.map((obj) =>
      obj.id === id ? { ...obj, enabled: !obj.enabled } : obj
    );

    const updatedProject = { ..._project, objects: updatedObjects };
    const compat = projectToLegacyProject(updatedProject, _videoUrl);

    set({
      _project: updatedProject,
      project: compat,
      overlays: compat?.overlays ?? DEFAULT_OVERLAYS,
      isDirty: true,
    });
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

// ─── New Project-aware selectors (for future migrated components) ─

/** Access the internal Project Model directly */
export function useProject(): Project | null {
  return useEditorStore((state) => state._project);
}

/** Access viewport state */
export function useViewport(): Viewport {
  return useEditorStore((state) => state.viewport);
}
