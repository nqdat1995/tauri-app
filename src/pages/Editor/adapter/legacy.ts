/**
 * Migration Adapter — Legacy Format Converters
 *
 * Converts between:
 *   - Old format (EditorProjectData from backend) → New Project Model
 *   - New Project Model → Old format (SaveEditorRequest for backend)
 *
 * Backend remains unchanged. All conversion happens on the frontend.
 */

import type {
  Project,
  EditorObject,
  ObjectType,
  Asset,
  EditorStyle,
  Transform,
  SubtitlePosition,
  BgShape,
} from "../model/types";
import {
  createMetadata,
  createSettings,
  createTrack,
  createTransform,
} from "../model/defaults";
import { createVideoAsset, createImageAsset } from "../assets";

// ─── Legacy Types (from old types.ts / backend response) ─────────

interface LegacySubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  originalText: string;
  translatedText: string;
  isNew: boolean;
}

interface LegacySubtitleStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  bgColor: string;
  bgShape: "box" | "rounded" | "none";
  position: string;
  bgOpacity: number;
}

interface LegacyOverlayItem {
  id: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface LegacyEditorOverlays {
  maxInstancesPerType: number;
  items: LegacyOverlayItem[];
}

export interface LegacyEditorProject {
  id: string;
  filename: string;
  duration: number;
  fileSize: number;
  width: number;
  height: number;
  processingTime: number;
  status: string;
  videoPath: string;
  subtitles: LegacySubtitleCue[];
  activeStyle: LegacySubtitleStyle;
  overlays: LegacyEditorOverlays;
}

export interface LegacySaveRequest {
  subtitles: LegacySubtitleCue[];
  style: LegacySubtitleStyle;
  overlays: LegacyEditorOverlays;
}

// ─── Legacy → Project Conversion ─────────────────────────────────

/**
 * Convert legacy EditorProjectData to new Project Model.
 * Used when loading a project from backend (read-only compat).
 */
export function legacyToProject(data: LegacyEditorProject): Project {
  // 1. Create video asset
  const videoAsset = createVideoAsset(data.videoPath, data.filename, {
    width: data.width,
    height: data.height,
    duration: data.duration,
    fileSize: data.fileSize,
  });

  const assets: Asset[] = [videoAsset];

  // 2. Convert subtitle style → EditorStyle
  const subtitleStyle: EditorStyle = {
    id: data.activeStyle.id || "default-subtitle-style",
    type: "subtitle",
    name: data.activeStyle.name || "Phụ đề",
    fontFamily: data.activeStyle.fontFamily || "system-ui",
    fontSize: data.activeStyle.fontSize || 14,
    textColor: data.activeStyle.textColor || "#ffffff",
    bgColor: data.activeStyle.bgColor || "#000000",
    bgShape: (data.activeStyle.bgShape as BgShape) || "rounded",
    bgOpacity: data.activeStyle.bgOpacity ?? 80,
    position: (data.activeStyle.position as SubtitlePosition) || "bottom-center",
  };

  const styles: EditorStyle[] = [subtitleStyle];

  // 3. Convert subtitle cues → EditorObjects
  const subtitleObjects: EditorObject[] = data.subtitles.map((cue) => ({
    id: cue.id,
    type: "subtitle" as ObjectType,
    startTime: cue.startTime,
    endTime: cue.endTime,
    transform: createTransform({
      position: null, // Use named position from style
      size: { width: 1600, height: 80 },
    }),
    styleId: subtitleStyle.id,
    enabled: true,
    config: {
      originalText: cue.originalText,
      translatedText: cue.translatedText,
      isNew: cue.isNew,
    },
  }));

  // 4. Convert overlay items → EditorObjects + image assets
  const overlayObjects: EditorObject[] = data.overlays.items.map((item) => {
    const config = convertOverlayConfig(item, assets);

    const transform: Transform = createTransform({
      position: { x: item.position.x, y: item.position.y },
      size: { width: item.size.width, height: item.size.height },
    });

    // Text overlays may need a style
    let styleId: string | null = null;
    if (item.type === "text") {
      const textStyle: EditorStyle = {
        id: `text-style-${item.id}`,
        type: "text",
        name: "Chữ",
        fontFamily: (item.config.fontFamily as string) || "system-ui",
        fontSize: (item.config.fontSize as number) || 18,
        textColor: (item.config.color as string) || "#ffffff",
        bgColor: (item.config.bgColor as string) || "#000000",
        bgShape: ((item.config.bgShape as string) || "rounded") as BgShape,
        bgOpacity: (item.config.bgOpacity as number) ?? 70,
        position: "center",
      };
      styles.push(textStyle);
      styleId = textStyle.id;
    }

    return {
      id: item.id,
      type: item.type as ObjectType,
      startTime: item.type === "text" ? ((item.config.startTime as number) ?? 0) : 0,
      endTime: item.type === "text" ? ((item.config.endTime as number) ?? data.duration) : data.duration,
      transform,
      styleId,
      enabled: item.enabled,
      config,
    };
  });

  // 5. Create tracks
  const allObjects = [...subtitleObjects, ...overlayObjects];
  const videoTrack = createTrack("video");
  const subtitleTrack = createTrack(
    "subtitle",
    subtitleObjects.map((o) => o.id)
  );
  const overlayTrack = createTrack(
    "overlay",
    overlayObjects.map((o) => o.id)
  );

  // 6. Assemble Project
  const metadata = createMetadata({
    id: data.id,
    name: data.filename,
    duration: data.duration,
    width: data.width,
    height: data.height,
    fileSize: data.fileSize,
    processingTime: data.processingTime,
    status: data.status,
  });

  return {
    metadata,
    assets,
    tracks: [videoTrack, subtitleTrack, overlayTrack],
    objects: allObjects,
    styles,
    settings: createSettings(subtitleStyle.id),
  };
}

// ─── Project → Legacy Conversion ─────────────────────────────────

/**
 * Convert new Project Model back to legacy SaveEditorRequest.
 * Used when saving to backend (which expects old format).
 */
export function projectToLegacy(project: Project): LegacySaveRequest {
  const { objects, styles, settings, assets } = project;

  // 1. Extract subtitle objects → LegacySubtitleCue[]
  const subtitleObjects = objects.filter((o) => o.type === "subtitle");
  const subtitles: LegacySubtitleCue[] = subtitleObjects.map((obj) => {
    const cfg = obj.config as { originalText: string; translatedText: string; isNew: boolean };
    return {
      id: obj.id,
      startTime: obj.startTime,
      endTime: obj.endTime,
      originalText: cfg.originalText,
      translatedText: cfg.translatedText,
      isNew: cfg.isNew,
    };
  });

  // 2. Resolve subtitle style → LegacySubtitleStyle
  const activeStyleId = settings.defaultSubtitleStyleId;
  const activeStyle = styles.find((s) => s.id === activeStyleId);
  const legacyStyle: LegacySubtitleStyle = activeStyle
    ? {
        id: activeStyle.id,
        name: activeStyle.name,
        fontFamily: activeStyle.fontFamily,
        fontSize: activeStyle.fontSize,
        textColor: activeStyle.textColor,
        bgColor: activeStyle.bgColor,
        bgShape: activeStyle.bgShape,
        position: activeStyle.position,
        bgOpacity: activeStyle.bgOpacity,
      }
    : {
        id: "default",
        name: "Default",
        fontFamily: "system-ui",
        fontSize: 14,
        textColor: "#ffffff",
        bgColor: "#000000",
        bgShape: "rounded",
        position: "bottom-center",
        bgOpacity: 80,
      };

  // 3. Extract overlay objects → LegacyOverlayItem[]
  const overlayObjects = objects.filter((o) => o.type !== "subtitle");
  const legacyOverlayItems: LegacyOverlayItem[] = overlayObjects.map((obj) => {
    const config = convertObjectToLegacyConfig(obj, styles, assets);

    return {
      id: obj.id,
      type: obj.type,
      enabled: obj.enabled,
      config,
      position: {
        x: obj.transform.position?.x ?? 0,
        y: obj.transform.position?.y ?? 0,
      },
      size: {
        width: obj.transform.size.width,
        height: obj.transform.size.height,
      },
    };
  });

  return {
    subtitles,
    style: legacyStyle,
    overlays: {
      maxInstancesPerType: 5,
      items: legacyOverlayItems,
    },
  };
}

// ─── Internal Helpers ────────────────────────────────────────────

function convertOverlayConfig(
  item: LegacyOverlayItem,
  assets: Asset[]
): EditorObject["config"] {
  switch (item.type) {
    case "background_overlay":
      return {
        color: (item.config.color as string) || "#000000",
        opacity: (item.config.opacity as number) ?? 50,
      };
    case "blur":
      return {
        color: (item.config.color as string) || "#000000",
        opacity: (item.config.opacity as number) ?? 30,
      };
    case "mirror":
      return { rotate180: !!(item.config.rotate180) };
    case "text":
      return { text: (item.config.text as string) || "Văn bản" };
    case "logo":
    case "watermark": {
      const path = (item.config.path as string) || "";
      let assetId = "";
      if (path) {
        // Create image asset for logo/watermark
        const imgAsset = createImageAsset(path);
        assets.push(imgAsset);
        assetId = imgAsset.id;
      }
      return {
        assetId,
        opacity: (item.config.opacity as number) ?? (item.type === "logo" ? 100 : 50),
      };
    }
    default:
      return { color: "#000000", opacity: 50 };
  }
}

function convertObjectToLegacyConfig(
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
      const cfg = obj.config as { text: string };
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
      const cfg = obj.config as { assetId: string; opacity: number };
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
