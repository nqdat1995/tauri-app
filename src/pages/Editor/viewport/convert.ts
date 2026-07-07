/**
 * Viewport — Coordinate Conversion Utilities
 *
 * Convert between Design Coordinate Space (1920×1080) and Screen Pixels.
 * All interaction events (mouse/touch) should pass through screenToProject()
 * before updating Project data.
 */

import type { Viewport } from "./types";
import type { Point, Size } from "../model/types";

/**
 * Convert a point from Design (project) coordinates to Screen pixels.
 * Used by renderer to position elements on screen.
 *
 * @param point - Point in design coordinates (e.g., {x: 960, y: 540})
 * @param viewport - Current viewport state
 * @returns Point in screen pixels relative to the video display area
 */
export function projectToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: point.x * viewport.scaleX,
    y: point.y * viewport.scaleY,
  };
}

/**
 * Convert a point from Screen pixels to Design (project) coordinates.
 * Used by interaction handlers (drag/resize) to store positions in project.
 *
 * @param point - Point in screen pixels relative to the video display area
 * @param viewport - Current viewport state
 * @returns Point in design coordinates (1920×1080 space)
 */
export function screenToProject(point: Point, viewport: Viewport): Point {
  if (viewport.scaleX === 0 || viewport.scaleY === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: Math.round(point.x / viewport.scaleX),
    y: Math.round(point.y / viewport.scaleY),
  };
}

/**
 * Convert a size from Design coordinates to Screen pixels.
 */
export function sizeToScreen(size: Size, viewport: Viewport): Size {
  return {
    width: size.width * viewport.scaleX,
    height: size.height * viewport.scaleY,
  };
}

/**
 * Convert a size from Screen pixels to Design coordinates.
 */
export function sizeToProject(size: Size, viewport: Viewport): Size {
  if (viewport.scaleX === 0 || viewport.scaleY === 0) {
    return { width: 0, height: 0 };
  }
  return {
    width: Math.round(size.width / viewport.scaleX),
    height: Math.round(size.height / viewport.scaleY),
  };
}

/**
 * Convert a mouse event position (relative to container) to Design coordinates.
 * Accounts for viewport offset (letterboxing).
 *
 * @param clientX - Mouse X relative to the video display container
 * @param clientY - Mouse Y relative to the video display container
 * @param viewport - Current viewport state
 * @returns Point in design coordinates, clamped to [0, spaceWidth/Height]
 */
export function mouseToProject(
  clientX: number,
  clientY: number,
  viewport: Viewport
): Point {
  if (viewport.scaleX === 0 || viewport.scaleY === 0) {
    return { x: 0, y: 0 };
  }

  // Subtract offset to get position relative to video display area
  const relX = clientX - viewport.offsetX;
  const relY = clientY - viewport.offsetY;

  // Convert to design coordinates
  const x = Math.round(relX / viewport.scaleX);
  const y = Math.round(relY / viewport.scaleY);

  return { x, y };
}

/**
 * Scale a font size from design space to screen pixels.
 * Uses the average of scaleX and scaleY for consistent text scaling.
 *
 * @param designFontSize - Font size in design coordinate space
 * @param viewport - Current viewport state
 * @param minSize - Minimum screen font size (default 10px)
 * @returns Font size in screen pixels
 */
export function scaleFontSize(
  designFontSize: number,
  viewport: Viewport,
  minSize: number = 10
): number {
  const scale = Math.max(viewport.scaleX, viewport.scaleY);
  return Math.max(minSize, Math.round(designFontSize * scale));
}
