use serde::{Deserialize, Serialize};

// ─── Subtitle ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleCue {
    pub id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub original_text: String,
    pub translated_text: String,
    #[serde(default)]
    pub is_new: bool,
}

// ─── Style ───────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorStyle {
    pub id: String,
    pub name: String,
    pub font_family: String,
    pub font_size: u32,
    pub text_color: String,
    pub bg_color: String,
    pub bg_shape: String,   // "box" | "rounded" | "none"
    pub position: String,   // "top" | "bottom"
    pub bg_opacity: u32,    // 0-100
}

// ─── Overlay ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayPosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlaySize {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayItem {
    pub id: String,
    #[serde(rename = "type")]
    pub overlay_type: String,
    pub enabled: bool,
    pub config: serde_json::Value,
    pub position: OverlayPosition,
    pub size: OverlaySize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorOverlays {
    pub max_instances_per_type: u32,
    pub items: Vec<OverlayItem>,
}

impl Default for EditorOverlays {
    fn default() -> Self {
        Self {
            max_instances_per_type: 5,
            items: Vec::new(),
        }
    }
}

// ─── Request / Response ──────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveEditorRequest {
    pub subtitles: Vec<SubtitleCue>,
    pub style: EditorStyle,
    pub overlays: EditorOverlays,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorProjectResponse {
    pub project: EditorProjectData,
    pub video_missing: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorProjectData {
    pub id: String,
    pub filename: String,
    pub duration: f64,
    pub file_size: u64,
    pub width: u32,
    pub height: u32,
    pub processing_time: f64,
    pub status: String,
    pub video_path: String,
    pub subtitles: Vec<SubtitleCue>,
    pub active_style: EditorStyle,
    pub overlays: EditorOverlays,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub status: String,
    pub updated_at: String,
}

impl Default for EditorStyle {
    fn default() -> Self {
        Self {
            id: "yellow-red-bg".to_string(),
            name: "Vàng nền đỏ".to_string(),
            font_family: "system-ui".to_string(),
            font_size: 22,
            text_color: "#fbbf24".to_string(),
            bg_color: "#dc2626".to_string(),
            bg_shape: "box".to_string(),
            position: "bottom".to_string(),
            bg_opacity: 92,
        }
    }
}
