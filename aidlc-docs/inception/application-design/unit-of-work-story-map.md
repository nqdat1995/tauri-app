# Unit of Work — Story Map

## Note
User Stories stage was SKIPPED (per execution plan — scope là technical completion, không có user personas mới). Story map này được derive trực tiếp từ Functional Requirements.

## Requirement-to-Unit Mapping

| Requirement | Unit | Files Affected |
|-------------|------|----------------|
| FR-01: Module Registration | translation-module | lib.rs, translation/mod.rs, Cargo.toml |
| FR-02: Global Config | translation-module | models.rs (AppSettings), storage.rs (minor) |
| FR-03: TranslationService Pipeline | translation-module | service.rs |
| FR-04: Error Handling Partial | translation-module | service.rs |
| FR-05: ChunkBuilder | translation-module | chunk_builder.rs |
| FR-06: ProviderFactory | translation-module | provider_factory.rs |
| FR-07: OpenAI Provider | translation-module | providers/openai.rs |
| FR-08: Gemini Provider | translation-module | providers/gemini.rs |
| FR-09: DeepSeek Provider | translation-module | providers/deepseek.rs |
| FR-10: Translation Prompt Format | translation-module | providers/openai.rs, gemini.rs, deepseek.rs |
| FR-11: Tauri Command | translation-module | commands.rs, lib.rs |
| FR-12: SubtitleCue translated_content | translation-module | service.rs (write logic) |

## All Requirements → Unit: translation-module
100% requirements map vào 1 unit duy nhất.
