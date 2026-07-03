pub mod deepseek;
pub mod gemini;
pub mod openai;

use async_trait::async_trait;

use crate::translation::models::*;

#[async_trait]
pub trait Translator: Send + Sync {
    async fn translate(&self, request: TranslationRequest) -> anyhow::Result<TranslationResult>;
}
