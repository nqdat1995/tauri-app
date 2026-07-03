use crate::translation::providers::Translator;
use crate::translation::providers::deepseek::DeepSeekProvider;
use crate::translation::providers::gemini::GeminiProvider;
use crate::translation::providers::openai::OpenAIProvider;

#[derive(Debug, Clone)]
pub enum ProviderType {
    OpenAI,
    Gemini,
    DeepSeek,
}

impl ProviderType {
    /// Parse a provider type from a string identifier (case-insensitive).
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "openai" => Some(Self::OpenAI),
            "gemini" => Some(Self::Gemini),
            "deepseek" => Some(Self::DeepSeek),
            _ => None,
        }
    }
}

/// Create a boxed `Translator` for the given provider type with the supplied credentials.
pub fn create_provider(
    provider: ProviderType,
    api_key: String,
    model: String,
) -> Box<dyn Translator> {
    match provider {
        ProviderType::OpenAI => Box::new(OpenAIProvider::new(api_key, model)),
        ProviderType::Gemini => Box::new(GeminiProvider::new(api_key, model)),
        ProviderType::DeepSeek => Box::new(DeepSeekProvider::new(api_key, model)),
    }
}
