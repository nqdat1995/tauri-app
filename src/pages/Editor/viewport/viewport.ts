/**
 * Viewport — Creation & Update Logic
 *
 * Computes the viewport mapping based on container size and video aspect ratio.
 * Handles letterboxing (black bars) when container aspect differs from video.
 */

import type { Viewport } from "./types";
import type { CoordinateSpace } from "../model/types";
import { DEFAULT_COORDINATE_SPACE } from "../model/defaults";

/**
 * Create an initial empty viewport.
 */
export function createViewport(): Viewport {
  return {
    containerWidth: 0,
    containerHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
    offsetX: 0,
    offsetY: 0,
    scaleX: 0,
    scaleY: 0,
  };
}

/**
 * Update viewport based on container dimensions and video aspect ratio.
 *
 * @param containerWidth  - Available width in screen pixels
 * @param containerHeight - Available height in screen pixels
 * @param videoAspect     - Video width/height ratio (e.g., 16/9 = 1.777...)
 * @param space           - Design coordinate space (default 1920×1080)
 * @returns Updated Viewport with computed display area and scale factors
 */
export function updateViewport(
  containerWidth: number,
  containerHeight: number,
  videoAspect: number,
  space: CoordinateSpace = DEFAULT_COORDINATE_SPACE
): Viewport {
  if (containerWidth <= 0 || containerHeight <= 0 || videoAspect <= 0) {
    return createViewport();
  }

  const containerAspect = containerWidth / containerHeight;

  let displayWidth: number;
  let displayHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (videoAspect > containerAspect) {
    // Video is wider than container → letterbox top/bottom
    displayWidth = containerWidth;
    displayHeight = containerWidth / videoAspect;
    offsetX = 0;
    offsetY = (containerHeight - displayHeight) / 2;
  } else {
    // Video is taller than container → letterbox left/right
    displayHeight = containerHeight;
    displayWidth = containerHeight * videoAspect;
    offsetX = (containerWidth - displayWidth) / 2;
    offsetY = 0;
  }

  const scaleX = displayWidth / space.width;
  const scaleY = displayHeight / space.height;

  return {
    containerWidth,
    containerHeight,
    displayWidth,
    displayHeight,
    offsetX,
    offsetY,
    scaleX,
    scaleY,
  };
}
