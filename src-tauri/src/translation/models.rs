use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationSegment {
    pub id: usize,
    pub start: String,
    pub end: String,
    pub text: String,
}

#[derive(Debug, Clone)]
pub struct TranslationRequest {
    pub source_language: String,
    pub target_language: String,
    pub segments: Vec<TranslationSegment>,
}

#[derive(Debug)]
pub struct TranslationResult {
    pub segments: Vec<TranslationSegment>,
}

/// Global application settings stored at ~/.tauri-translate-app/settings.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// AI provider: "openai", "gemini", or "deepseek"
    #[serde(default = "default_provider")]
    pub provider: String,
    /// API key for the selected provider
    #[serde(default)]
    pub api_key: String,
    /// Model name (e.g. "gpt-4o-mini", "gemini-1.5-flash", "deepseek-chat")
    #[serde(default = "default_model")]
    pub model: String,
    /// Default target language for translation (e.g. "Vietnamese", "English")
    #[serde(default = "default_target_language")]
    pub target_language: String,
    /// Max number of subtitle segments per translation chunk (default: 30)
    #[serde(default = "default_chunk_size")]
    pub chunk_size: usize,
}

fn default_provider() -> String {
    "openai".to_string()
}

fn default_model() -> String {
    "gpt-4o-mini".to_string()
}

fn default_target_language() -> String {
    "Vietnamese".to_string()
}

fn default_chunk_size() -> usize {
    30
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            provider: default_provider(),
            api_key: String::new(),
            model: default_model(),
            target_language: default_target_language(),
            chunk_size: default_chunk_size(),
        }
    }
}