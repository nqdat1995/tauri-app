use anyhow::{anyhow, Context, Result};
use async_trait::async_trait;
use serde_json::{json, Value};

use crate::translation::models::{TranslationRequest, TranslationResult, TranslationSegment};
use crate::translation::providers::Translator;

// DeepSeek uses an OpenAI-compatible API
const DEEPSEEK_API_URL: &str = "https://api.deepseek.com/chat/completions";

pub struct DeepSeekProvider {
    api_key: String,
    model: String,
}

impl DeepSeekProvider {
    pub fn new(api_key: String, model: String) -> Self {
        Self { api_key, model }
    }

    fn build_request_body(&self, request: &TranslationRequest) -> Value {
        let segments_json: Vec<Value> = request
            .segments
            .iter()
            .map(|s| json!({ "id": s.id, "text": s.text }))
            .collect();

        let system_prompt = format!(
            "You are a professional subtitle translator. \
             Translate the given subtitle segments from {} to {}. \
             Rules:\n\
             - Return ONLY a JSON array with the same number of objects as input\n\
             - Each object must have exactly two fields: \"id\" (integer, same as input) and \"text\" (translated string)\n\
             - Preserve the original meaning, tone, and style\n\
             - Keep translated text concise to fit subtitle timing\n\
             - Do NOT add explanations, notes, or any extra text outside the JSON array",
            request.source_language, request.target_language
        );

        let user_prompt = format!(
            "Translate these subtitle segments:\n{}",
            serde_json::to_string(&segments_json).unwrap_or_default()
        );

        json!({
            "model": self.model,
            "messages": [
                { "role": "system", "content": system_prompt },
                { "role": "user",   "content": user_prompt }
            ],
            "temperature": 0.3
        })
    }

    async fn call_api(&self, body: Value) -> Result<String> {
        let client = reqwest::Client::new();
        let response = client
            .post(DEEPSEEK_API_URL)
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await
            .context("Failed to send request to DeepSeek API")?;

        let status = response.status();
        let text = response
            .text()
            .await
            .context("Failed to read DeepSeek response body")?;

        if !status.is_success() {
            return Err(anyhow!("DeepSeek API error {}: {}", status, text));
        }

        // OpenAI-compatible response: choices[0].message.content
        let parsed: Value =
            serde_json::from_str(&text).context("Failed to parse DeepSeek response JSON")?;
        let content = parsed
            .get("choices")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("message"))
            .and_then(|m| m.get("content"))
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Unexpected DeepSeek response shape: {}", text))?
            .to_string();

        Ok(content)
    }

    fn parse_response(
        &self,
        raw: &str,
        original_segments: &[TranslationSegment],
    ) -> Result<TranslationResult> {
        let json_str = extract_json_array(raw);
        let items: Vec<Value> = serde_json::from_str(&json_str)
            .context("Failed to parse DeepSeek translation JSON array")?;

        let mut translated_map = std::collections::HashMap::new();
        for item in &items {
            let id = item
                .get("id")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| anyhow!("Missing or invalid 'id' in DeepSeek item: {}", item))?
                as usize;
            let text = item
                .get("text")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow!("Missing or invalid 'text' in DeepSeek item: {}", item))?
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
                "DeepSeek segment count mismatch: expected {}, got {}",
                expected_count,
                result.segments.len()
            ));
        }
        Ok(())
    }
}

#[async_trait]
impl Translator for DeepSeekProvider {
    async fn translate(&self, request: TranslationRequest) -> Result<TranslationResult> {
        let expected_count = request.segments.len();
        let original_segments = request.segments.clone();
        let body = self.build_request_body(&request);
        let raw = self.call_api(body).await?;
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
