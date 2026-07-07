/**
 * Project Model — Public API
 */

// Types
export type {
  CoordinateSpace,
  Point,
  Size,
  Transform,
  Project,
  ProjectMetadata,
  ProjectSettings,
  AssetType,
  Asset,
  AssetMetadata,
  TrackType,
  Track,
  ObjectType,
  EditorObject,
  SubtitleConfig,
  BackgroundOverlayConfig,
  BlurOverlayConfig,
  MirrorOverlayConfig,
  TextOverlayConfig,
  LogoOverlayConfig,
  WatermarkOverlayConfig,
  ObjectConfig,
  StyleType,
  SubtitlePosition,
  BgShape,
  EditorStyle,
} from "./types";

// Factories & Defaults
export {
  generateId,
  DEFAULT_COORDINATE_SPACE,
  createTransform,
  getDefaultConfig,
  getDefaultSize,
  getDefaultPosition,
  createObject,
  createTrack,
  createStyle,
  createSettings,
  createMetadata,
  createProject,
  PRESET_SUBTITLE_STYLES,
  DEFAULT_TEXT_STYLE,
} from "./defaults";
