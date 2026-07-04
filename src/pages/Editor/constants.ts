/**
 * Video Editor — Constants & Presets
 * Unit 1: editor-store
 */

import type { SubtitleStyle, OverlayType, EditorOverlays } from "./types";

// ─── Overlay Configuration ───────────────────────────────────────

/** Maximum number of instances per overlay type (configurable) */
export const MAX_OVERLAY_INSTANCES = 5;

export interface OverlayTypeInfo {
  type: OverlayType;
  label: string;
  icon: string;
}

export const OVERLAY_TYPES: OverlayTypeInfo[] = [
  { type: "background_overlay", label: "Nền phủ", icon: "🎨" },
  { type: "blur", label: "Kính mờ", icon: "🔲" },
  { type: "mirror", label: "Hiệu ứng gương", icon: "🪞" },
  { type: "text", label: "Chữ", icon: "T" },
  { type: "logo", label: "Logo", icon: "🖼" },
  { type: "watermark", label: "Watermark", icon: "💧" },
];

// ─── Default Overlay State ───────────────────────────────────────

export const DEFAULT_OVERLAYS: EditorOverlays = {
  maxInstancesPerType: MAX_OVERLAY_INSTANCES,
  items: [],
};

// ─── Font Options ────────────────────────────────────────────────

export interface FontOption {
  value: string;
  label: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: "system-ui", label: "Hệ thống - Mặc định của hệ điều hành" },
  { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Noto Sans', sans-serif", label: "Noto Sans" },
];

// ─── Subtitle Style Presets ──────────────────────────────────────

export const PRESET_STYLES: SubtitleStyle[] = [
  {
    id: "no-subtitle",
    name: "Không phụ đề",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#ffffff",
    bgColor: "transparent",
    bgShape: "none",
    position: "bottom",
    bgOpacity: 0,
  },
  {
    id: "white-black-bg",
    name: "Trắng nền đen",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#ffffff",
    bgColor: "#000000",
    bgShape: "rounded",
    position: "bottom",
    bgOpacity: 80,
  },
  {
    id: "red-bg-white",
    name: "Nền đỏ chữ trắng",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#ffffff",
    bgColor: "#dc2626",
    bgShape: "rounded",
    position: "bottom",
    bgOpacity: 92,
  },
  {
    id: "blue-bg-white",
    name: "Trắng nền xanh",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#ffffff",
    bgColor: "#2563eb",
    bgShape: "rounded",
    position: "bottom",
    bgOpacity: 80,
  },
  {
    id: "black-no-bg",
    name: "Đen không nền",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#1f2937",
    bgColor: "transparent",
    bgShape: "none",
    position: "bottom",
    bgOpacity: 0,
  },
  {
    id: "white-no-bg",
    name: "Trắng không nền",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#ffffff",
    bgColor: "transparent",
    bgShape: "none",
    position: "bottom",
    bgOpacity: 0,
  },
  {
    id: "yellow-black-bg",
    name: "Vàng nền đen",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#fbbf24",
    bgColor: "#000000",
    bgShape: "rounded",
    position: "bottom",
    bgOpacity: 85,
  },
  {
    id: "brand-purple-bg",
    name: "Nền tím chữ trắng",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#ffffff",
    bgColor: "#5b44ff",
    bgShape: "rounded",
    position: "bottom",
    bgOpacity: 90,
  },
  {
    id: "yellow-red-bg",
    name: "Vàng nền đỏ",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#fbbf24",
    bgColor: "#dc2626",
    bgShape: "box",
    position: "bottom",
    bgOpacity: 92,
  },
  {
    id: "green-bg-white",
    name: "Trắng nền xanh lá",
    fontFamily: "system-ui",
    fontSize: 22,
    textColor: "#ffffff",
    bgColor: "#059669",
    bgShape: "rounded",
    position: "bottom",
    bgOpacity: 85,
  },
];

/** Default active style (matches mockup: yellow text on red bg) */
export const DEFAULT_STYLE: SubtitleStyle = PRESET_STYLES[8]; // yellow-red-bg
