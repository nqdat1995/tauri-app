/**
 * Video Editor — Type Definitions
 * Unit 1: editor-store
 */

// ─── Subtitle Types ──────────────────────────────────────────────

export interface SubtitleCue {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  originalText: string;
  translatedText: string;
  isNew: boolean; // true = user-added, false = from STT
}

// ─── Style Types ─────────────────────────────────────────────────

export type BgShape = "box" | "rounded" | "none";
export type SubtitlePosition = "top-left" | "top-center" | "top-right" | "middle-left" | "center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface SubtitleStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number; // px
  textColor: string; // hex
  bgColor: string; // hex or "transparent"
  bgShape: BgShape;
  position: SubtitlePosition;
  bgOpacity: number; // 0-100
}

// ─── Overlay Types ───────────────────────────────────────────────

export type OverlayType =
  | "background_overlay"
  | "blur"
  | "mirror"
  | "text"
  | "logo"
  | "watermark";

export interface OverlayPosition {
  x: number;
  y: number;
}

export interface OverlaySize {
  width: number;
  height: number;
}

/** Config varies per overlay type */
export interface BackgroundOverlayConfig {
  color: string;
  opacity: number;
  [key: string]: unknown;
}

export interface BlurOverlayConfig {
  color: string;
  opacity: number;
  [key: string]: unknown;
}

export interface MirrorOverlayConfig {
  rotate180: boolean;
  [key: string]: unknown;
}

export interface TextOverlayConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  [key: string]: unknown;
}

export interface LogoOverlayConfig {
  path: string;
  opacity: number;
  [key: string]: unknown;
}

export interface WatermarkOverlayConfig {
  path: string;
  opacity: number;
  [key: string]: unknown;
}

export type OverlayConfig =
  | BackgroundOverlayConfig
  | BlurOverlayConfig
  | MirrorOverlayConfig
  | TextOverlayConfig
  | LogoOverlayConfig
  | WatermarkOverlayConfig;

export interface OverlayItem {
  id: string;
  type: OverlayType;
  enabled: boolean;
  config: OverlayConfig;
  position: OverlayPosition;
  size: OverlaySize;
}

export interface EditorOverlays {
  maxInstancesPerType: number;
  items: OverlayItem[];
}

// ─── Project Types ───────────────────────────────────────────────

export type EditorStatus = "has_subtitle" | "processing" | "ready";

export interface EditorProject {
  id: string;
  filename: string;
  duration: number; // seconds
  fileSize: number; // bytes
  width: number;
  height: number;
  processingTime: number; // seconds
  status: EditorStatus;
  videoPath: string;
  subtitles: SubtitleCue[];
  activeStyle: SubtitleStyle;
  overlays: EditorOverlays;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

// ─── API Request/Response Types ──────────────────────────────────

export interface SaveEditorRequest {
  subtitles: SubtitleCue[];
  style: SubtitleStyle;
  overlays: EditorOverlays;
}

export interface LoadEditorResponse {
  project: EditorProject;
  videoMissing: boolean;
}

// ─── Store State Types ───────────────────────────────────────────

export interface EditorState {
  // Data
  project: EditorProject | null;
  subtitles: SubtitleCue[];
  activeStyle: SubtitleStyle;
  overlays: EditorOverlays;

  // Playback
  currentTime: number;
  isPlaying: boolean;

  // UI state
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface EditorActions {
  // Project lifecycle
  loadProject: (projectId: string) => Promise<void>;
  loadRecentProject: () => Promise<void>;
  saveProject: () => Promise<void>;

  // Subtitle CRUD
  updateSubtitle: (id: string, field: keyof Pick<SubtitleCue, "originalText" | "translatedText" | "startTime" | "endTime">, value: string | number) => void;
  addSubtitle: (afterId?: string) => void;
  deleteSubtitle: (id: string) => void;

  // Style
  updateStyle: (updates: Partial<SubtitleStyle>) => void;
  selectPreset: (presetId: string) => void;

  // Overlay
  addOverlay: (type: OverlayType) => void;
  removeOverlay: (id: string) => void;
  updateOverlay: (id: string, updates: Partial<OverlayItem>) => void;
  toggleOverlay: (id: string) => void;

  // Playback control
  setCurrentTime: (time: number) => void;
  seekTo: (time: number) => void;
  setPlaying: (playing: boolean) => void;

  // Utility
  resetDirty: () => void;
  clearError: () => void;
}
