use anyhow::{anyhow, Context, Result};
use async_trait::async_trait;
use serde_json::{json, Value};

use crate::translation::models::{TranslationRequest, TranslationResult, TranslationSegment};
use crate::translation::providers::Translator;

const GEMINI_API_BASE: &str =
    "https://generativelanguage.googleapis.com/v1beta/models";

pub struct GeminiProvider {
    api_key: String,
    model: String,
}

impl GeminiProvider {
    pub fn new(api_key: String, model: String) -> Self {
        Self { api_key, model }
    }

    fn build_prompt_text(&self, request: &TranslationRequest) -> String {
        let segments_json: Vec<Value> = request
            .segments
            .iter()
            .map(|s| json!({ "id": s.id, "text": s.text }))
            .collect();

        format!(
            "You are a professional subtitle translator. \
             Translate the following subtitle segments from {} to {}.\n\
             Rules:\n\
             - Return ONLY a JSON array with the same number of objects as input\n\
             - Each object must have exactly two fields: \"id\" (integer, same as input) and \"text\" (translated string)\n\
             - Preserve meaning, tone, and style\n\
             - Keep translated text concise to fit subtitle timing\n\
             - Do NOT add explanations or any extra text outside the JSON array\n\n\
             Segments to translate:\n{}",
            request.source_language,
            request.target_language,
            serde_json::to_string(&segments_json).unwrap_or_default()
        )
    }

    async fn call_api(&self, prompt: String) -> Result<String> {
        let url = format!(
            "{}/{}:generateContent?key={}",
            GEMINI_API_BASE, self.model, self.api_key
        );

        let body = json!({
            "contents": [{
                "parts": [{ "text": prompt }]
            }],
            "generationConfig": {
                "temperature": 0.3
            }
        });

        let client = reqwest::Client::new();
        let response = client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .context("Failed to send request to Gemini API")?;

        let status = response.status();
        let text = response
            .text()
            .await
            .context("Failed to read Gemini response body")?;

        if !status.is_success() {
            return Err(anyhow!("Gemini API error {}: {}", status, text));
        }

        // Extract candidates[0].content.parts[0].text
        let parsed: Value =
            serde_json::from_str(&text).context("Failed to parse Gemini response JSON")?;
        let content = parsed
            .get("candidates")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("content"))
            .and_then(|c| c.get("parts"))
            .and_then(|p| p.get(0))
            .and_then(|p| p.get("text"))
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Unexpected Gemini response shape: {}", text))?
            .to_string();

        Ok(content)
    }

    fn parse_response(
        &self,
        raw: &str,
        original_segments: &[TranslationSegment],
    ) -> Result<TranslationResult> {
        let json_str = extract_json_array(raw);
        let items: Vec<Value> =
            serde_json::from_str(&json_str).context("Failed to parse Gemini translation JSON array")?;

        let mut translated_map = std::collections::HashMap::new();
        for item in &items {
            let id = item
                .get("id")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| anyhow!("Missing or invalid 'id' in Gemini translated item: {}", item))?
                as usize;
            let text = item
                .get("text")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow!("Missing or invalid 'text' in Gemini translated item: {}", item))?
                .to_string();
            translated_map.insert(id, text);
        }

        let segments: Vec<TranslationSegment> = original_segments
            .iter()
            .map(|s| {
                let translated_text = translated_map
                    .get(&s.id)
                    .cloned()
                    .unwrap_or_else(|| s.text.clone());
                TranslationSegment {
                    id: s.id,
                    start: s.start.clone(),
                    end: s.end.clone(),
                    text: translated_text,
                }
            })
            .collect();

        Ok(TranslationResult { segments })
    }

    fn validate(&self, result: &TranslationResult, expected_count: usize) -> Result<()> {
        if result.segments.len() != expected_count {
            return Err(anyhow!(
                "Gemini segment count mismatch: expected {}, got {}",
                expected_count,
                result.segments.len()
            ));
        }
        Ok(())
    }
}

#[async_trait]
impl Translator for GeminiProvider {
    async fn translate(&self, request: TranslationRequest) -> Result<TranslationResult> {
        let expected_count = request.segments.len();
        let original_segments = request.segments.clone();
        let prompt = self.build_prompt_text(&request);
        let raw = self.call_api(prompt).await?;
        let result = self.parse_response(&raw, &original_segments)?;
        self.validate(&result, expected_count)?;
        Ok(result)
    }
}

fn extract_json_array(raw: &str) -> String {
    let trimmed = raw.trim();
    if let Some(start) = trimmed.find('[') {
        if let Some(end) = trimmed.rfind(']') {
            if end >= start {
                return trimmed[start..=end].to_string();
            }
        }
    }
    trimmed.to_string()
}
