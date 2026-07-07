/**
 * Renderer — Interface Definition
 *
 * Formal abstraction allowing future swap from HTML → Canvas/Konva.
 * Current implementation: HTMLRenderer (JSX + CSS + react-rnd).
 */

import type { SceneGraph } from "../scene/types";

/**
 * Renderer interface.
 * Implementations receive a SceneGraph and return renderable output.
 */
export interface Renderer {
  /** Render the scene graph. Returns React elements for HTML-based renderers. */
  render(scene: SceneGraph): React.ReactNode;

  /** Optional cleanup when renderer is disposed. */
  dispose?(): void;
}
