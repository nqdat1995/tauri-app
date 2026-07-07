/**
 * Project Model — Core Type Definitions
 * Single Source of Truth for the Video Editor.
 *
 * All positions/sizes are in Design Coordinate Space (default 1920×1080).
 * Viewport conversion happens at render time only.
 */

// ─── Coordinate & Transform ──────────────────────────────────────

export interface CoordinateSpace {
  width: number;   // default 1920
  height: number;  // default 1080
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  /** Position in design coordinates. null = use style's named position (for subtitles). */
  position: Point | null;
  size: Size;
  rotation: number;   // degrees (default 0, future use)
  opacity: number;    // 0–100 (default 100)
}

// ─── Project ─────────────────────────────────────────────────────

export interface Project {
  metadata: ProjectMetadata;
  assets: Asset[];
  tracks: Track[];
  objects: EditorObject[];
  styles: EditorStyle[];
  settings: ProjectSettings;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  fps: number;
  duration: number;           // seconds
  coordinateSpace: CoordinateSpace;
  width: number;              // original video width
  height: number;             // original video height
  fileSize: number;           // bytes
  processingTime: number;     // seconds
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  /** true = all subtitle cues share the same style; false = per-cue style override */
  subtitleApplyAll: boolean;
  /** Default style ID applied to subtitles when subtitleApplyAll=true */
  defaultSubtitleStyleId: string;
}

// ─── Asset ───────────────────────────────────────────────────────

export type AssetType = "video" | "audio" | "image" | "font";

export interface Asset {
  id: string;
  type: AssetType;
  source: string;             // file path or asset:// URL
  name: string;               // display name
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  mimeType?: string;
}

// ─── Track ───────────────────────────────────────────────────────

export type TrackType = "video" | "subtitle" | "overlay";

export interface Track {
  id: string;
  type: TrackType;
  objectIds: string[];        // ordered references to EditorObject.id
}

// ─── Object ──────────────────────────────────────────────────────

export type ObjectType =
  | "subtitle"
  | "background_overlay"
  | "blur"
  | "mirror"
  | "text"
  | "logo"
  | "watermark";

export interface EditorObject {
  id: string;
  type: ObjectType;
  startTime: number;          // seconds
  endTime: number;            // seconds
  transform: Transform;
  /** Style reference (for subtitle + text overlay). null = inline/no style. */
  styleId: string | null;
  enabled: boolean;
  config: ObjectConfig;
}

// ─── Object Configs (discriminated by ObjectType) ────────────────

export interface SubtitleConfig {
  originalText: string;
  translatedText: string;
  isNew: boolean;
}

export interface BackgroundOverlayConfig {
  color: string;
  opacity: number;            // 0–100
}

export interface BlurOverlayConfig {
  color: string;
  opacity: number;            // 0–100 (maps to blur amount)
}

export interface MirrorOverlayConfig {
  rotate180: boolean;
}

export interface TextOverlayConfig {
  text: string;
  // Visual properties referenced via styleId
}

export interface LogoOverlayConfig {
  assetId: string;            // reference to Asset.id
  opacity: number;            // 0–100
}

export interface WatermarkOverlayConfig {
  assetId: string;            // reference to Asset.id
  opacity: number;            // 0–100
}

export type ObjectConfig =
  | SubtitleConfig
  | BackgroundOverlayConfig
  | BlurOverlayConfig
  | MirrorOverlayConfig
  | TextOverlayConfig
  | LogoOverlayConfig
  | WatermarkOverlayConfig;

// ─── Style ───────────────────────────────────────────────────────

export type StyleType = "subtitle" | "text";

export type SubtitlePosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type BgShape = "box" | "rounded" | "none";

export interface EditorStyle {
  id: string;
  type: StyleType;
  name: string;
  fontFamily: string;
  fontSize: number;           // px (in design coordinate space)
  textColor: string;          // hex
  bgColor: string;            // hex or "transparent"
  bgShape: BgShape;
  bgOpacity: number;          // 0–100
  /** Named position for subtitles (9-grid). Used when Object.transform.position is null. */
  position: SubtitlePosition;
}
