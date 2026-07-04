/**
 * OverlayViewport — Drag/resize overlay items on video viewport
 * FR-ED-09: Overlay — visual editing (drag + resize)
 * Uses react-rnd for draggable + resizable behavior
 */

import { Rnd } from "react-rnd";
import { useEditorStore } from "./store";
import { OVERLAY_TYPES } from "./constants";

interface OverlayViewportProps {
  /** Viewport container dimensions (for coordinate normalization) */
  containerWidth: number;
  containerHeight: number;
}

export function OverlayViewport({ containerWidth, containerHeight }: OverlayViewportProps) {
  const items = useEditorStore((s) => s.overlays.items);
  const updateOverlay = useEditorStore((s) => s.updateOverlay);

  // Only show enabled items that have meaningful size (not full-screen background types)
  const visibleItems = items.filter(
    (item) => item.enabled && item.type !== "background_overlay" && item.type !== "mirror"
  );

  if (visibleItems.length === 0 || containerWidth === 0) return null;

  return (
    <div className="overlay-viewport" data-testid="overlay-viewport">
      {visibleItems.map((item) => {
        const typeInfo = OVERLAY_TYPES.find((t) => t.type === item.type);
        // Scale position/size relative to container
        const scaleX = containerWidth / 1920;
        const scaleY = containerHeight / 1080;
        const x = item.position.x * scaleX;
        const y = item.position.y * scaleY;
        const w = item.size.width * scaleX;
        const h = item.size.height * scaleY;

        return (
          <Rnd
            key={item.id}
            position={{ x, y }}
            size={{ width: w, height: h }}
            bounds="parent"
            onDragStop={(_e, d) => {
              updateOverlay(item.id, {
                position: {
                  x: Math.round(d.x / scaleX),
                  y: Math.round(d.y / scaleY),
                },
              });
            }}
            onResizeStop={(_e, _dir, ref, _delta, pos) => {
              updateOverlay(item.id, {
                size: {
                  width: Math.round(parseInt(ref.style.width, 10) / scaleX),
                  height: Math.round(parseInt(ref.style.height, 10) / scaleY),
                },
                position: {
                  x: Math.round(pos.x / scaleX),
                  y: Math.round(pos.y / scaleY),
                },
              });
            }}
            className="overlay-viewport__item"
            data-testid={`overlay-rnd-${item.id}`}
          >
            <div className="overlay-viewport__item-label">
              {typeInfo?.icon} {typeInfo?.label}
            </div>
          </Rnd>
        );
      })}
    </div>
  );
}
