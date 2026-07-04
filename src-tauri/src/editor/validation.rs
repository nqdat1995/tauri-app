use super::models::{EditorOverlays, EditorStyle, SubtitleCue};

/// Validate subtitle cues: required fields and timing ranges.
pub fn validate_subtitles(cues: &[SubtitleCue]) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    for (i, cue) in cues.iter().enumerate() {
        if cue.id.is_empty() {
            errors.push(format!("Cue {}: missing id", i));
        }
        if cue.start_time < 0.0 {
            errors.push(format!("Cue {}: start_time cannot be negative", i));
        }
        if cue.end_time < 0.0 {
            errors.push(format!("Cue {}: end_time cannot be negative", i));
        }
        if cue.start_time >= cue.end_time {
            errors.push(format!(
                "Cue {} ({}): start_time ({}) must be less than end_time ({})",
                i, cue.id, cue.start_time, cue.end_time
            ));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Validate editor style: value ranges.
pub fn validate_style(style: &EditorStyle) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    if style.font_size == 0 || style.font_size > 200 {
        errors.push(format!(
            "font_size must be between 1 and 200, got {}",
            style.font_size
        ));
    }

    if style.bg_opacity > 100 {
        errors.push(format!(
            "bg_opacity must be between 0 and 100, got {}",
            style.bg_opacity
        ));
    }

    let valid_shapes = ["box", "rounded", "none"];
    if !valid_shapes.contains(&style.bg_shape.as_str()) {
        errors.push(format!(
            "bg_shape must be one of {:?}, got '{}'",
            valid_shapes, style.bg_shape
        ));
    }

    let valid_positions = ["top", "bottom"];
    if !valid_positions.contains(&style.position.as_str()) {
        errors.push(format!(
            "position must be one of {:?}, got '{}'",
            valid_positions, style.position
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Validate overlays: max instances per type.
pub fn validate_overlays(overlays: &EditorOverlays) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();
    let max = overlays.max_instances_per_type;

    // Count instances per type
    let mut counts: std::collections::HashMap<&str, u32> = std::collections::HashMap::new();
    for item in &overlays.items {
        *counts.entry(item.overlay_type.as_str()).or_insert(0) += 1;
    }

    for (overlay_type, count) in &counts {
        if *count > max {
            errors.push(format!(
                "Overlay type '{}' has {} instances, max allowed is {}",
                overlay_type, count, max
            ));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}
