/**
 * Viewport — Type Definitions
 *
 * Viewport represents the mapping between Design Coordinate Space (1920×1080)
 * and the actual screen pixels where the video is displayed.
 */

export interface Viewport {
  /** Container element dimensions (full available area) */
  containerWidth: number;
  containerHeight: number;

  /** Computed video display area (accounting for letterboxing) */
  displayWidth: number;
  displayHeight: number;

  /** Offset from container top-left to video display area top-left */
  offsetX: number;
  offsetY: number;

  /** Scale factors: screen pixels per design unit */
  scaleX: number; // displayWidth / coordinateSpace.width
  scaleY: number; // displayHeight / coordinateSpace.height
}
