use serde::Serialize;
use uuid::Uuid;

/// Represents a single subtitle cue parsed from an SRT file.
#[derive(Debug, Serialize)]
pub struct SubtitleCue {
    pub cue_id: String,
    pub sequence: usize,
    pub start_time: u64,
    pub end_time: u64,
    pub duration: u64,
    pub content: String,
    pub translated_content: Option<String>,
}

/// Parses SRT-formatted text into a list of subtitle cues.
pub fn parse_srt(srt: &str) -> Result<Vec<SubtitleCue>, String> {
    let mut cues = Vec::new();
    let blocks: Vec<&str> = srt.split("\n\n").collect();
    for (index, block) in blocks.iter().enumerate() {
        let trimmed = block.trim();
        if trimmed.is_empty() {
            continue;
        }
        let lines: Vec<&str> = trimmed.lines().collect();
        if lines.len() < 2 {
            continue;
        }
        let timecode = lines[1].trim();
        let parts: Vec<&str> = timecode.split(" --> ").collect();
        if parts.len() != 2 {
            continue;
        }
        let start_time = parse_timecode(parts[0])?;
        let end_time = parse_timecode(parts[1])?;
        let content = lines[2..].join("\n").trim().to_string();
        cues.push(SubtitleCue {
            cue_id: Uuid::new_v4().to_string(),
            sequence: index + 1,
            start_time,
            end_time,
            duration: end_time.saturating_sub(start_time),
            content,
            translated_content: None,
        });
    }
    Ok(cues)
}

/// Parses an SRT timecode string (e.g. `00:00:01,500`) into milliseconds.
pub fn parse_timecode(value: &str) -> Result<u64, String> {
    let value = value.trim();
    let parts: Vec<&str> = value.split(',').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid timecode: {}", value));
    }
    let seconds_part = parts[0];
    let millis_part = parts[1];
    let time_parts: Vec<&str> = seconds_part.split(':').collect();
    if time_parts.len() != 3 {
        return Err(format!("Invalid timecode: {}", value));
    }
    let hours = time_parts[0].parse::<u64>().map_err(|e| e.to_string())?;
    let minutes = time_parts[1].parse::<u64>().map_err(|e| e.to_string())?;
    let seconds = time_parts[2].parse::<u64>().map_err(|e| e.to_string())?;
    let millis = millis_part.parse::<u64>().map_err(|e| e.to_string())?;
    Ok(hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + millis)
}
