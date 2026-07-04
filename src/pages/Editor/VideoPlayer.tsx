/**
 * VideoPlayer — Video playback with subtitle overlay
 * FR-ED-02: Video Playback
 * FR-ED-03: Subtitle Overlay on Video
 */

import { useRef, useCallback, useEffect } from "react";
import { useEditorStore, useActiveCue } from "./store";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const project = useEditorStore((s) => s.project);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const activeStyle = useEditorStore((s) => s.activeStyle);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const seekTo = useEditorStore((s) => s.seekTo);
  const setPlaying = useEditorStore((s) => s.setPlaying);

  const activeCue = useActiveCue();
  const duration = project?.duration ?? 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Sync video element with store state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onEnded = () => setPlaying(false);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [setCurrentTime, setPlaying]);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    }
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  const handleSkipPrev = useCallback(() => {
    const t = Math.max(0, currentTime - 3);
    seekTo(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [currentTime, seekTo]);

  const handleSkipNext = useCallback(() => {
    const t = Math.min(duration, currentTime + 3);
    seekTo(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [currentTime, duration, seekTo]);

  const handleSeekbarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = ratio * duration;
    seekTo(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [duration, seekTo]);

  // Build subtitle overlay style
  const subtitleOverlayStyle: React.CSSProperties = activeCue ? {
    fontFamily: activeStyle.fontFamily,
    fontSize: `${activeStyle.fontSize}px`,
    color: activeStyle.textColor,
    backgroundColor: activeStyle.bgShape !== "none"
      ? `${activeStyle.bgColor}${Math.round((activeStyle.bgOpacity / 100) * 255).toString(16).padStart(2, "0")}`
      : "transparent",
    borderRadius: activeStyle.bgShape === "rounded" ? "6px" : activeStyle.bgShape === "box" ? "3px" : "0",
    padding: activeStyle.bgShape !== "none" ? "4px 14px" : "4px",
  } : {};

  return (
    <div className="video-player" data-testid="video-player">
      {/* Viewport */}
      <div className="video-player__viewport" onClick={handlePlayPause} data-testid="video-player-viewport">
        {project?.videoPath ? (
          <video ref={videoRef} src={project.videoPath} className="video-player__video" />
        ) : (
          <div className="video-player__placeholder">
            <span className="video-player__placeholder-icon">▶</span>
          </div>
        )}

        {/* Subtitle overlay */}
        {activeCue && (
          <div
            className={`video-player__subtitle video-player__subtitle--${activeStyle.position}`}
            style={subtitleOverlayStyle}
            data-testid="video-player-subtitle-overlay"
          >
            {activeCue.translatedText}
          </div>
        )}
      </div>

      {/* Seekbar */}
      <div className="video-player__seekbar" onClick={handleSeekbarClick} data-testid="video-player-seekbar">
        <div className="video-player__seekbar-track">
          <div className="video-player__seekbar-fill" style={{ width: `${progress}%` }} />
          <div className="video-player__seekbar-handle" style={{ left: `${progress}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="video-player__controls">
        <div className="video-player__controls-left">
          <button className="vp-btn" type="button" onClick={handleSkipPrev} data-testid="video-player-prev">⏮</button>
          <button className="vp-btn vp-btn--play" type="button" onClick={handlePlayPause} data-testid="video-player-play">
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="vp-btn" type="button" onClick={handleSkipNext} data-testid="video-player-next">⏭</button>
          <span className="video-player__time" data-testid="video-player-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="video-player__controls-right">
          <button className="vp-btn" type="button" title="Âm lượng">🔊</button>
          <button className="vp-btn" type="button" title="Tốc độ">⏱</button>
          <button className="vp-btn" type="button" title="Phụ đề">☰</button>
          <button className="vp-btn" type="button" title="Toàn màn hình">⛶</button>
        </div>
      </div>
    </div>
  );
}
