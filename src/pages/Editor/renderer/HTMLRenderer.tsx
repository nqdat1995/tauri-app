/**
 * HTMLRenderer — HTML/CSS/react-rnd based Scene Graph Renderer
 *
 * This renderer takes a SceneGraph and produces React elements.
 * It preserves the existing rendering approach (CSS + react-rnd)
 * while consuming data from the Scene Graph instead of the store directly.
 *
 * Note: This is the INTERFACE implementation only.
 * Full integration with existing VideoPlayer component happens in Unit 6 integration
 * (modifying VideoPlayer to use this renderer). For now, this establishes the contract.
 */

import React from "react";
import type { Renderer } from "./types";
import type { SceneGraph, SceneNode } from "../scene/types";

/**
 * HTMLRenderer — implements Renderer interface.
 *
 * Renders SceneGraph nodes as HTML/CSS elements.
 * Currently a reference implementation showing the rendering contract.
 * The existing VideoPlayer.tsx will be gradually migrated to use this.
 */
export class HTMLRenderer implements Renderer {
  render(scene: SceneGraph): React.ReactNode {
    if (!scene.nodes.length) return null;

    return React.createElement(
      React.Fragment,
      null,
      scene.nodes.map((node) => this.renderNode(node))
    );
  }

  dispose(): void {
    // Cleanup resources if needed (e.g., canvas contexts, animation frames)
  }

  // ─── Private: Node Rendering ─────────────────────────────────

  private renderNode(node: SceneNode): React.ReactNode {
    if (!node.visible) return null;

    switch (node.type) {
      case "video":
        return this.renderVideoNode(node);
      case "group":
        return this.renderGroupNode(node);
      case "text":
        return this.renderTextNode(node);
      case "image":
        return this.renderImageNode(node);
      case "blur":
        return this.renderBlurNode(node);
      case "mirror":
        return this.renderMirrorNode(node);
      case "background":
        return this.renderBackgroundNode(node);
      default:
        return null;
    }
  }

  private renderVideoNode(_node: SceneNode): React.ReactNode {
    // Video element is managed externally (VideoPlayer owns the <video> ref)
    // This node exists in the scene graph for completeness and future Canvas renderer
    return null;
  }

  private renderGroupNode(node: SceneNode): React.ReactNode {
    const { transform } = node;
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${transform.x}px`,
      top: `${transform.y}px`,
      width: `${transform.width}px`,
      height: `${transform.height}px`,
      opacity: transform.opacity,
      pointerEvents: "none",
    };

    return React.createElement(
      "div",
      {
        key: node.id,
        className: "scene-group",
        style,
        "data-object-id": node.objectId,
      },
      node.children?.map((child) => this.renderNode(child))
    );
  }

  private renderTextNode(node: SceneNode): React.ReactNode {
    if (node.data.kind !== "text") return null;
    const { text, fontFamily, fontSize, color, bgColor, bgShape, bgOpacity } = node.data;

    const bgAlpha = Math.round((bgOpacity / 100) * 255)
      .toString(16)
      .padStart(2, "0");

    const style: React.CSSProperties = {
      fontFamily,
      fontSize: `${fontSize}px`,
      color,
      backgroundColor: bgShape !== "none" ? `${bgColor}${bgAlpha}` : "transparent",
      borderRadius: bgShape === "rounded" ? "6px" : bgShape === "box" ? "3px" : "0",
      padding: bgShape !== "none" ? "6px 18px" : "4px",
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      textShadow: bgShape === "none" ? "0 1px 3px rgba(0,0,0,0.8)" : "none",
      pointerEvents: "none",
      userSelect: "none",
      lineHeight: "1.4",
    };

    return React.createElement("span", { key: node.id, style }, text);
  }

  private renderImageNode(node: SceneNode): React.ReactNode {
    if (node.data.kind !== "image") return null;
    const { source } = node.data;
    const { transform } = node;

    if (!source) {
      return React.createElement("div", {
        key: node.id,
        className: "ob-placeholder",
        style: {
          width: `${transform.width}px`,
          height: `${transform.height}px`,
        },
      });
    }

    return React.createElement("img", {
      key: node.id,
      src: source,
      className: "ob-img",
      style: {
        width: "100%",
        height: "100%",
        display: "block",
        opacity: transform.opacity,
      },
      alt: "",
    });
  }

  private renderBlurNode(node: SceneNode): React.ReactNode {
    if (node.data.kind !== "blur") return null;
    const { color, blurAmount } = node.data;

    return React.createElement("div", {
      key: node.id,
      className: "ob-fill",
      style: {
        width: "100%",
        height: "100%",
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
        backgroundColor: `${color}22`,
      },
    });
  }

  private renderMirrorNode(node: SceneNode): React.ReactNode {
    if (node.data.kind !== "mirror") return null;
    // Mirror rendering requires canvas + video ref — handled by VideoPlayer directly
    // This placeholder ensures the node is represented in the scene
    return React.createElement("div", {
      key: node.id,
      className: "ob-fill ob-mirror",
      style: { width: "100%", height: "100%", overflow: "hidden" },
      "data-mirror-region": JSON.stringify(node.data.sourceRegion),
      "data-rotate180": String(node.data.rotate180),
    });
  }

  private renderBackgroundNode(node: SceneNode): React.ReactNode {
    if (node.data.kind !== "background") return null;
    const { color, opacity } = node.data;

    const alpha = Math.round((opacity / 100) * 255)
      .toString(16)
      .padStart(2, "0");

    return React.createElement("div", {
      key: node.id,
      className: "ob-fill",
      style: {
        width: "100%",
        height: "100%",
        backgroundColor: `${color}${alpha}`,
      },
    });
  }
}
