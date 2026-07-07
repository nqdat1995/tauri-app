/**
 * Scene Graph — Type Definitions
 *
 * Scene Graph is the intermediate layer between Project Model and Renderer.
 * It represents "what to render at this frame" with screen-ready coordinates.
 */

import type { Viewport } from "../viewport/types";

// ─── Node Types ──────────────────────────────────────────────────

export type SceneNodeType =
  | "video"
  | "group"
  | "text"
  | "image"
  | "blur"
  | "mirror"
  | "background";

// ─── Screen Transform (already in screen pixels) ─────────────────

export interface ScreenTransform {
  x: number;        // screen pixels
  y: number;        // screen pixels
  width: number;    // screen pixels
  height: number;   // screen pixels
  rotation: number; // degrees
  opacity: number;  // 0–1
}

// ─── Scene Node ──────────────────────────────────────────────────

export interface SceneNode {
  id: string;
  type: SceneNodeType;
  /** Source object ID in Project (for interaction mapping) */
  objectId: string;
  transform: ScreenTransform;
  visible: boolean;
  children?: SceneNode[];
  data: SceneNodeData;
}

// ─── Node-specific Data ──────────────────────────────────────────

export interface VideoNodeData {
  kind: "video";
  assetSource: string;
  currentTime: number;
}

export interface TextNodeData {
  kind: "text";
  text: string;
  fontFamily: string;
  fontSize: number;     // screen-scaled px
  color: string;
  bgColor: string;
  bgShape: string;      // "box" | "rounded" | "none"
  bgOpacity: number;    // 0–100
}

export interface ImageNodeData {
  kind: "image";
  source: string;
  objectFit: "contain" | "cover" | "fill";
}

export interface BlurNodeData {
  kind: "blur";
  color: string;
  blurAmount: number;   // px
}

export interface MirrorNodeData {
  kind: "mirror";
  /** Source region in DESIGN coordinates (for canvas sampling) */
  sourceRegion: { x: number; y: number; width: number; height: number };
  rotate180: boolean;
}

export interface BackgroundNodeData {
  kind: "background";
  color: string;
  opacity: number;      // 0–100
}

export type SceneNodeData =
  | VideoNodeData
  | TextNodeData
  | ImageNodeData
  | BlurNodeData
  | MirrorNodeData
  | BackgroundNodeData;

// ─── Scene Graph ─────────────────────────────────────────────────

export interface SceneGraph {
  nodes: SceneNode[];
  viewport: Viewport;
  currentTime: number;
}
