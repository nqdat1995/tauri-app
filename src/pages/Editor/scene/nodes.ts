/**
 * Scene Graph — Node Factory Functions
 *
 * Creates SceneNode instances for each visual element type.
 */

import type {
  SceneNode,
  ScreenTransform,
  VideoNodeData,
  TextNodeData,
  ImageNodeData,
  BlurNodeData,
  MirrorNodeData,
  BackgroundNodeData,
} from "./types";

// ─── Transform Helper ────────────────────────────────────────────

export function createScreenTransform(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0,
  opacity = 1
): ScreenTransform {
  return { x, y, width, height, rotation, opacity };
}

// ─── Node Factories ──────────────────────────────────────────────

export function createVideoNode(
  objectId: string,
  transform: ScreenTransform,
  data: VideoNodeData
): SceneNode {
  return {
    id: `scene-video-${objectId}`,
    type: "video",
    objectId,
    transform,
    visible: true,
    data,
  };
}

export function createTextNode(
  objectId: string,
  transform: ScreenTransform,
  data: TextNodeData
): SceneNode {
  return {
    id: `scene-text-${objectId}`,
    type: "text",
    objectId,
    transform,
    visible: true,
    data,
  };
}

export function createImageNode(
  objectId: string,
  transform: ScreenTransform,
  data: ImageNodeData
): SceneNode {
  return {
    id: `scene-image-${objectId}`,
    type: "image",
    objectId,
    transform,
    visible: true,
    data,
  };
}

export function createBlurNode(
  objectId: string,
  transform: ScreenTransform,
  data: BlurNodeData
): SceneNode {
  return {
    id: `scene-blur-${objectId}`,
    type: "blur",
    objectId,
    transform,
    visible: true,
    data,
  };
}

export function createMirrorNode(
  objectId: string,
  transform: ScreenTransform,
  data: MirrorNodeData
): SceneNode {
  return {
    id: `scene-mirror-${objectId}`,
    type: "mirror",
    objectId,
    transform,
    visible: true,
    data,
  };
}

export function createBackgroundNode(
  objectId: string,
  transform: ScreenTransform,
  data: BackgroundNodeData
): SceneNode {
  return {
    id: `scene-bg-${objectId}`,
    type: "background",
    objectId,
    transform,
    visible: true,
    data,
  };
}

export function createGroupNode(
  objectId: string,
  transform: ScreenTransform,
  children: SceneNode[]
): SceneNode {
  return {
    id: `scene-group-${objectId}`,
    type: "group",
    objectId,
    transform,
    visible: true,
    children,
    data: { kind: "background", color: "transparent", opacity: 0 }, // placeholder data for group
  };
}
