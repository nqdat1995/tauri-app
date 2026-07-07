/**
 * Project Model — Factory Functions & Defaults
 * Creates valid default instances of all model types.
 */

import type {
  Project,
  ProjectMetadata,
  ProjectSettings,
  CoordinateSpace,
  Transform,
  Point,
  Size,
  Track,
  TrackType,
  EditorObject,
  ObjectType,
  ObjectConfig,
  EditorStyle,
  StyleType,
} from "./types";

// ─── ID Generation ───────────────────────────────────────────────

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Coordinate Space ────────────────────────────────────────────

export const DEFAULT_COORDINATE_SPACE: CoordinateSpace = {
  width: 1920,
  height: 1080,
};

// ─── Transform ───────────────────────────────────────────────────

export function createTransform(overrides?: Partial<Transform>): Transform {
  return {
    position: null,
    size: { width: 200, height: 100 },
    rotation: 0,
    opacity: 100,
    ...overrides,
  };
}

// ─── Default Object Configs ──────────────────────────────────────

export function getDefaultConfig(type: ObjectType): ObjectConfig {
  switch (type) {
    case "subtitle":
      return { originalText: "", translatedText: "", isNew: true };
    case "background_overlay":
      return { color: "#000000", opacity: 50 };
    case "blur":
      return { color: "#000000", opacity: 30 };
    case "mirror":
      return { rotate180: false };
    case "text":
      return { text: "Văn bản" };
    case "logo":
      return { assetId: "", opacity: 100 };
    case "watermark":
      return { assetId: "", opacity: 50 };
  }
}

// ─── Default Object Sizes ────────────────────────────────────────

export function getDefaultSize(type: ObjectType): Size {
  switch (type) {
    case "subtitle":
      return { width: 1600, height: 80 };
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

// ─── Default Object Position ─────────────────────────────────────

export function getDefaultPosition(type: ObjectType): Point | null {
  switch (type) {
    case "subtitle":
      // Subtitle uses named position from style (null = style default)
      return null;
    default: {
      // Center in design space
      const size = getDefaultSize(type);
      return {
        x: (DEFAULT_COORDINATE_SPACE.width - size.width) / 2,
        y: (DEFAULT_COORDINATE_SPACE.height - size.height) / 2,
      };
    }
  }
}

// ─── Object Factory ──────────────────────────────────────────────

export function createObject(
  type: ObjectType,
  overrides?: Partial<EditorObject>
): EditorObject {
  const size = getDefaultSize(type);
  const position = getDefaultPosition(type);

  return {
    id: generateId(),
    type,
    startTime: 0,
    endTime: 5,
    transform: createTransform({ position, size }),
    styleId: null,
    enabled: true,
    config: getDefaultConfig(type),
    ...overrides,
  };
}

// ─── Track Factory ───────────────────────────────────────────────

export function createTrack(type: TrackType, objectIds: string[] = []): Track {
  return {
    id: generateId(),
    type,
    objectIds,
  };
}

// ─── Style Factory ───────────────────────────────────────────────

export function createStyle(
  type: StyleType,
  overrides?: Partial<EditorStyle>
): EditorStyle {
  return {
    id: generateId(),
    type,
    name: type === "subtitle" ? "Phụ đề mặc định" : "Chữ mặc định",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#ffffff",
    bgColor: "#000000",
    bgShape: "rounded",
    bgOpacity: 80,
    position: "bottom-center",
    ...overrides,
  };
}

// ─── Project Settings ────────────────────────────────────────────

export function createSettings(defaultStyleId: string): ProjectSettings {
  return {
    subtitleApplyAll: true,
    defaultSubtitleStyleId: defaultStyleId,
  };
}

// ─── Project Metadata ────────────────────────────────────────────

export function createMetadata(overrides?: Partial<ProjectMetadata>): ProjectMetadata {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: "Untitled",
    fps: 30,
    duration: 0,
    coordinateSpace: DEFAULT_COORDINATE_SPACE,
    width: 1920,
    height: 1080,
    fileSize: 0,
    processingTime: 0,
    status: "ready",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Full Project Factory ────────────────────────────────────────

export function createProject(overrides?: Partial<Project>): Project {
  const defaultStyle = createStyle("subtitle", {
    id: "default-subtitle-style",
    name: "Trắng nền đen",
    textColor: "#ffffff",
    bgColor: "#000000",
    bgShape: "rounded",
    bgOpacity: 80,
    position: "bottom-center",
  });

  return {
    metadata: createMetadata(),
    assets: [],
    tracks: [
      createTrack("video"),
      createTrack("subtitle"),
      createTrack("overlay"),
    ],
    objects: [],
    styles: [defaultStyle],
    settings: createSettings(defaultStyle.id),
    ...overrides,
  };
}

// ─── Preset Styles (converted from existing PRESET_STYLES) ──────

export const PRESET_SUBTITLE_STYLES: EditorStyle[] = [
  {
    id: "no-subtitle",
    type: "subtitle",
    name: "Không phụ đề",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#ffffff",
    bgColor: "transparent",
    bgShape: "none",
    bgOpacity: 0,
    position: "bottom-center",
  },
  {
    id: "white-black-bg",
    type: "subtitle",
    name: "Trắng nền đen",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#ffffff",
    bgColor: "#000000",
    bgShape: "rounded",
    bgOpacity: 80,
    position: "bottom-center",
  },
  {
    id: "red-bg-white",
    type: "subtitle",
    name: "Nền đỏ chữ trắng",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#ffffff",
    bgColor: "#dc2626",
    bgShape: "rounded",
    bgOpacity: 92,
    position: "bottom-center",
  },
  {
    id: "blue-bg-white",
    type: "subtitle",
    name: "Trắng nền xanh",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#ffffff",
    bgColor: "#2563eb",
    bgShape: "rounded",
    bgOpacity: 80,
    position: "bottom-center",
  },
  {
    id: "black-no-bg",
    type: "subtitle",
    name: "Đen không nền",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#1f2937",
    bgColor: "transparent",
    bgShape: "none",
    bgOpacity: 0,
    position: "bottom-center",
  },
  {
    id: "white-no-bg",
    type: "subtitle",
    name: "Trắng không nền",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#ffffff",
    bgColor: "transparent",
    bgShape: "none",
    bgOpacity: 0,
    position: "bottom-center",
  },
  {
    id: "yellow-black-bg",
    type: "subtitle",
    name: "Vàng nền đen",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#fbbf24",
    bgColor: "#000000",
    bgShape: "rounded",
    bgOpacity: 85,
    position: "bottom-center",
  },
  {
    id: "brand-purple-bg",
    type: "subtitle",
    name: "Nền tím chữ trắng",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#ffffff",
    bgColor: "#5b44ff",
    bgShape: "rounded",
    bgOpacity: 90,
    position: "bottom-center",
  },
  {
    id: "yellow-red-bg",
    type: "subtitle",
    name: "Vàng nền đỏ",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#fbbf24",
    bgColor: "#dc2626",
    bgShape: "box",
    bgOpacity: 92,
    position: "bottom-center",
  },
  {
    id: "green-bg-white",
    type: "subtitle",
    name: "Trắng nền xanh lá",
    fontFamily: "system-ui",
    fontSize: 14,
    textColor: "#ffffff",
    bgColor: "#059669",
    bgShape: "rounded",
    bgOpacity: 85,
    position: "bottom-center",
  },
];

/** Default text overlay style */
export const DEFAULT_TEXT_STYLE: EditorStyle = {
  id: "default-text-style",
  type: "text",
  name: "Chữ mặc định",
  fontFamily: "system-ui",
  fontSize: 18,
  textColor: "#ffffff",
  bgColor: "#000000",
  bgShape: "rounded",
  bgOpacity: 70,
  position: "center",
};
