/**
 * Scene Graph — Builder
 *
 * Transforms Project Model + currentTime + Viewport → SceneGraph.
 * Responsibilities:
 *   1. Filter objects by currentTime (visibility)
 *   2. Resolve styleId → style properties
 *   3. Convert design coordinates → screen coordinates
 *   4. Build node tree (GroupNodes for subtitle/text)
 */

import type { Project, EditorObject, EditorStyle, SubtitlePosition } from "../model/types";
import type { Viewport } from "../viewport/types";
import { projectToScreen, sizeToScreen, scaleFontSize } from "../viewport/convert";
import type {
  SceneGraph,
  SceneNode,
  ScreenTransform,
} from "./types";
import {
  createScreenTransform,
  createVideoNode,
  createTextNode,
  createBackgroundNode,
  createBlurNode,
  createMirrorNode,
  createImageNode,
  createGroupNode,
} from "./nodes";
import { findAsset } from "../assets";

// ─── Named Position Resolver ─────────────────────────────────────

/**
 * Resolve a named subtitle position (9-grid) to design coordinates.
 * Returns the center point for the subtitle in design space.
 */
function resolveNamedPosition(
  position: SubtitlePosition,
  objWidth: number,
  objHeight: number
): { x: number; y: number } {
  const spaceW = 1920;
  const spaceH = 1080;
  const margin = 0.08; // 8% margin from edges

  const left = spaceW * margin;
  const right = spaceW * (1 - margin) - objWidth;
  const centerX = (spaceW - objWidth) / 2;
  const top = spaceH * margin;
  const bottom = spaceH * (1 - margin) - objHeight;
  const middleY = (spaceH - objHeight) / 2;

  switch (position) {
    case "top-left":
      return { x: left, y: top };
    case "top-center":
      return { x: centerX, y: top };
    case "top-right":
      return { x: right, y: top };
    case "middle-left":
      return { x: left, y: middleY };
    case "center":
      return { x: centerX, y: middleY };
    case "middle-right":
      return { x: right, y: middleY };
    case "bottom-left":
      return { x: left, y: bottom };
    case "bottom-center":
      return { x: centerX, y: bottom };
    case "bottom-right":
      return { x: right, y: bottom };
    default:
      return { x: centerX, y: bottom };
  }
}

// ─── Style Resolver ──────────────────────────────────────────────

function findStyle(styles: EditorStyle[], styleId: string | null): EditorStyle | null {
  if (!styleId) return null;
  return styles.find((s) => s.id === styleId) ?? null;
}

// ─── Object → Screen Transform ──────────────────────────────────

function objectToScreenTransform(
  obj: EditorObject,
  style: EditorStyle | null,
  viewport: Viewport
): ScreenTransform {
  const size = sizeToScreen(obj.transform.size, viewport);

  let designPos: { x: number; y: number };

  if (obj.transform.position) {
    // Custom position (user dragged)
    designPos = obj.transform.position;
  } else if (style) {
    // Use named position from style
    designPos = resolveNamedPosition(
      style.position,
      obj.transform.size.width,
      obj.transform.size.height
    );
  } else {
    // Fallback: center
    designPos = {
      x: (1920 - obj.transform.size.width) / 2,
      y: (1080 - obj.transform.size.height) / 2,
    };
  }

  const screenPos = projectToScreen(designPos, viewport);

  return createScreenTransform(
    screenPos.x,
    screenPos.y,
    size.width,
    size.height,
    obj.transform.rotation,
    obj.transform.opacity / 100
  );
}

// ─── Build Subtitle Node (GroupNode) ─────────────────────────────

function buildSubtitleNode(
  obj: EditorObject,
  style: EditorStyle | null,
  viewport: Viewport
): SceneNode {
  const config = obj.config as { originalText: string; translatedText: string };
  const text = config.translatedText || config.originalText || "";

  if (!text || !style) {
    // Empty subtitle or no style — invisible node
    const transform = objectToScreenTransform(obj, style, viewport);
    return createGroupNode(obj.id, transform, []);
  }

  const groupTransform = objectToScreenTransform(obj, style, viewport);
  const fontSize = scaleFontSize(style.fontSize, viewport);

  // Background node (fills group area)
  const bgNode = createBackgroundNode(
    `${obj.id}-bg`,
    createScreenTransform(0, 0, groupTransform.width, groupTransform.height),
    {
      kind: "background",
      color: style.bgColor,
      opacity: style.bgOpacity,
    }
  );

  // Text node (centered within group)
  const textNode = createTextNode(
    `${obj.id}-text`,
    createScreenTransform(0, 0, groupTransform.width, groupTransform.height),
    {
      kind: "text",
      text,
      fontFamily: style.fontFamily,
      fontSize,
      color: style.textColor,
      bgColor: style.bgColor,
      bgShape: style.bgShape,
      bgOpacity: style.bgOpacity,
    }
  );

  return createGroupNode(obj.id, groupTransform, [bgNode, textNode]);
}

// ─── Build Text Overlay Node (GroupNode) ─────────────────────────

function buildTextOverlayNode(
  obj: EditorObject,
  style: EditorStyle | null,
  viewport: Viewport
): SceneNode {
  const config = obj.config as { text: string };
  const text = config.text || "Văn bản";

  const groupTransform = objectToScreenTransform(obj, style, viewport);

  const resolvedStyle = style ?? {
    fontFamily: "system-ui",
    fontSize: 18,
    textColor: "#ffffff",
    bgColor: "#000000",
    bgShape: "rounded",
    bgOpacity: 70,
  };

  const fontSize = scaleFontSize(resolvedStyle.fontSize, viewport);

  const textNode = createTextNode(
    `${obj.id}-text`,
    createScreenTransform(0, 0, groupTransform.width, groupTransform.height),
    {
      kind: "text",
      text,
      fontFamily: resolvedStyle.fontFamily,
      fontSize,
      color: resolvedStyle.textColor,
      bgColor: resolvedStyle.bgColor,
      bgShape: resolvedStyle.bgShape,
      bgOpacity: resolvedStyle.bgOpacity,
    }
  );

  return createGroupNode(obj.id, groupTransform, [textNode]);
}

// ─── Build Overlay Nodes ─────────────────────────────────────────

function buildOverlayNode(
  obj: EditorObject,
  style: EditorStyle | null,
  viewport: Viewport,
  project: Project
): SceneNode {
  const transform = objectToScreenTransform(obj, style, viewport);

  switch (obj.type) {
    case "background_overlay": {
      const cfg = obj.config as { color: string; opacity: number };
      return createBackgroundNode(obj.id, transform, {
        kind: "background",
        color: cfg.color,
        opacity: cfg.opacity,
      });
    }

    case "blur": {
      const cfg = obj.config as { color: string; opacity: number };
      return createBlurNode(obj.id, transform, {
        kind: "blur",
        color: cfg.color,
        blurAmount: cfg.opacity / 10, // legacy: opacity maps to blur px
      });
    }

    case "mirror": {
      const cfg = obj.config as { rotate180: boolean };
      return createMirrorNode(obj.id, transform, {
        kind: "mirror",
        sourceRegion: {
          x: obj.transform.position?.x ?? 0,
          y: obj.transform.position?.y ?? 0,
          width: obj.transform.size.width,
          height: obj.transform.size.height,
        },
        rotate180: cfg.rotate180,
      });
    }

    case "text":
      return buildTextOverlayNode(obj, style, viewport);

    case "logo": {
      const cfg = obj.config as { assetId: string; opacity: number };
      const asset = findAsset(project.assets, cfg.assetId);
      return createImageNode(obj.id, transform, {
        kind: "image",
        source: asset?.source ?? "",
        objectFit: "contain",
      });
    }

    case "watermark": {
      const cfg = obj.config as { assetId: string; opacity: number };
      const asset = findAsset(project.assets, cfg.assetId);
      return createImageNode(obj.id, transform, {
        kind: "image",
        source: asset?.source ?? "",
        objectFit: "contain",
      });
    }

    default:
      return createBackgroundNode(obj.id, transform, {
        kind: "background",
        color: "transparent",
        opacity: 0,
      });
  }
}

// ─── Main Builder ────────────────────────────────────────────────

/**
 * Build Scene Graph from Project Model.
 *
 * @param project     - Full project data
 * @param currentTime - Current playback time (seconds)
 * @param viewport    - Current viewport state
 * @returns SceneGraph ready for renderer consumption
 */
export function buildScene(
  project: Project,
  currentTime: number,
  viewport: Viewport
): SceneGraph {
  if (!project || viewport.scaleX === 0) {
    return { nodes: [], viewport, currentTime };
  }

  const nodes: SceneNode[] = [];
  const { objects, styles, assets, settings } = project;

  // 1. Video node (always first)
  const videoAsset = assets.find((a) => a.type === "video");
  if (videoAsset) {
    const videoTransform = createScreenTransform(
      0,
      0,
      viewport.displayWidth,
      viewport.displayHeight,
      0,
      1
    );
    nodes.push(
      createVideoNode("video-main", videoTransform, {
        kind: "video",
        assetSource: videoAsset.source,
        currentTime,
      })
    );
  }

  // 2. Filter visible objects at current time
  const visibleObjects = objects.filter((obj) => {
    if (!obj.enabled) return false;
    if (currentTime < obj.startTime) return false;
    if (currentTime >= obj.endTime) return false;
    return true;
  });

  // 3. Build nodes for each visible object
  for (const obj of visibleObjects) {
    // Resolve style
    let style: EditorStyle | null = null;
    if (obj.styleId) {
      style = findStyle(styles, obj.styleId);
    } else if (obj.type === "subtitle" && settings.subtitleApplyAll) {
      style = findStyle(styles, settings.defaultSubtitleStyleId);
    }

    // Build appropriate node
    if (obj.type === "subtitle") {
      const node = buildSubtitleNode(obj, style, viewport);
      if (node.children && node.children.length > 0) {
        nodes.push(node);
      }
    } else {
      const node = buildOverlayNode(obj, style, viewport, project);
      nodes.push(node);
    }
  }

  return { nodes, viewport, currentTime };
}
