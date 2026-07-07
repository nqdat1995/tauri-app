/**
 * Asset Registry — CRUD operations for project assets.
 * Assets are stored within the Project model.
 * This module provides utility functions for managing them.
 */

import type { Asset, AssetType, AssetMetadata } from "../model/types";
import { generateId } from "../model/defaults";

// ─── Create Asset ────────────────────────────────────────────────

export function createAsset(
  type: AssetType,
  source: string,
  name: string,
  metadata?: Partial<AssetMetadata>
): Asset {
  return {
    id: generateId(),
    type,
    source,
    name,
    metadata: {
      fileSize: undefined,
      width: undefined,
      height: undefined,
      duration: undefined,
      mimeType: undefined,
      ...metadata,
    },
  };
}

/** Create a video asset from project data */
export function createVideoAsset(
  source: string,
  name: string,
  metadata: { width?: number; height?: number; duration?: number; fileSize?: number }
): Asset {
  return createAsset("video", source, name, {
    ...metadata,
    mimeType: "video/mp4",
  });
}

/** Create an image asset (for logo/watermark) */
export function createImageAsset(
  source: string,
  name?: string,
  metadata?: { width?: number; height?: number; fileSize?: number }
): Asset {
  const displayName = name || source.split("/").pop() || "image";
  return createAsset("image", source, displayName, {
    ...metadata,
    mimeType: guessImageMime(source),
  });
}

// ─── Query ───────────────────────────────────────────────────────

/** Find asset by ID in a list */
export function findAsset(assets: Asset[], id: string): Asset | undefined {
  return assets.find((a) => a.id === id);
}

/** Find assets by type */
export function findAssetsByType(assets: Asset[], type: AssetType): Asset[] {
  return assets.filter((a) => a.type === type);
}

/** Get the video asset (first video type) */
export function getVideoAsset(assets: Asset[]): Asset | undefined {
  return assets.find((a) => a.type === "video");
}

// ─── Mutate (immutable — returns new array) ──────────────────────

/** Add asset to list (returns new array) */
export function addAsset(assets: Asset[], asset: Asset): Asset[] {
  return [...assets, asset];
}

/** Remove asset by ID (returns new array) */
export function removeAsset(assets: Asset[], id: string): Asset[] {
  return assets.filter((a) => a.id !== id);
}

/** Update asset metadata (returns new array) */
export function updateAssetSource(assets: Asset[], id: string, source: string): Asset[] {
  return assets.map((a) => (a.id === id ? { ...a, source } : a));
}

// ─── Helpers ─────────────────────────────────────────────────────

function guessImageMime(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/png";
  }
}
