use crate::translation::models::TranslationSegment;

pub struct ChunkBuilder {
    max_segments: usize,
}

impl ChunkBuilder {
    pub fn new(max_segments: usize) -> Self {
        Self { max_segments }
    }

    pub fn split(&self, segments: &[TranslationSegment]) -> Vec<Vec<TranslationSegment>> {
        segments
            .chunks(self.max_segments)
            .map(|chunk| chunk.to_vec())
            .collect()
    }
}
