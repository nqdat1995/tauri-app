/**
 * Video Editor — Mock Data
 * Unit 1: editor-store
 * Used for development when Tauri backend is not available.
 */

import type { SubtitleCue, EditorProject, EditorOverlays } from "./types";
import { DEFAULT_STYLE, DEFAULT_OVERLAYS } from "./constants";

export const MOCK_SUBTITLES: SubtitleCue[] = [
  {
    id: "cue-001",
    startTime: 2.65,
    endTime: 5.98,
    originalText: "又谁晚。",
    translatedText: "Ai nữa vậy?",
    isNew: false,
  },
  {
    id: "cue-002",
    startTime: 5.98,
    endTime: 11.64,
    originalText: "有没有李不是啊，你谁，你不认识他红的眼睛啊，你就去。",
    translatedText:
      "Có chữ mà, không phải à, anh là ai, anh không nhận ra mắt nó đỏ à, vậy thì đi đi.",
    isNew: false,
  },
  {
    id: "cue-003",
    startTime: 11.64,
    endTime: 13.06,
    originalText: "我不知道。",
    translatedText: "Tôi không biết.",
    isNew: false,
  },
];

export const MOCK_OVERLAYS: EditorOverlays = DEFAULT_OVERLAYS;

export const MOCK_PROJECT: EditorProject = {
  id: "dd6e9790-0009-4514-a357-c55491dc0475",
  filename: "dd6e9790-0009-4514-a357-c55491dc0475.mp4",
  duration: 13.06,
  fileSize: 5.9 * 1024 * 1024, // 5.9 MB
  width: 2160,
  height: 3840,
  processingTime: 31,
  status: "has_subtitle",
  videoPath: "", // No real video in mock mode
  subtitles: MOCK_SUBTITLES,
  activeStyle: DEFAULT_STYLE,
  overlays: MOCK_OVERLAYS,
};
